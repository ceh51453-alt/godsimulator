/**
 * Lập kế hoạch, validate và giải quyết ý định — Phần 67.4, 67.5, 68 [BB].
 *
 * [BB] 67.5 — `failure` KHÔNG được là "hệ thống không hiểu". Nó phải nêu nguyên nhân
 * TRONG THẾ GIỚI: thiếu thời gian, không biết đường, luật cấm, người kia không đồng ý,
 * vật liệu không có, cơ thể không chịu nổi.
 *
 * [BB] "Nếu còn một con đường hợp lý, resolver trả `partial`, `alternative` hoặc
 * `project_started`, KHÔNG dựng tường."
 *
 * [BB] 67.3 — resolver lập kế hoạch trên WorldView + Knowledge của chủ thể,
 * KHÔNG bao giờ trên World thật.
 */
import type { WorldView } from '../contracts/view.js';
import type { Event, PatchOp } from '../contracts/core.js';
import type { BlockReason } from '../contracts/primitives.js';
import { BlockReasonSchema } from '../contracts/primitives.js';
import { ActionPlanSchema, ActionOutcomeSchema, ProjectSchema } from './schema.js';
import type { Intent, ActionPlan, ActionOutcome, Project, KnowledgeRecord } from './schema.js';
import { taoEvent } from '../engine/transaction.js';
import { taoRng } from '../engine/rng.js';
import { refDoanDuoc, laDauHieuProject } from './parser.js';
import { R, napDungSan } from '../registry/index.js';
import type { Tuning } from '../tuning/schema.js';

export type NgocCanhGiai = {
  view: WorldView;
  intent: Intent;
  /** Tri thức của chủ thể. [BB] Kế hoạch chỉ được dựa trên đây, không dựa World. */
  triThuc: readonly KnowledgeRecord[];
  tuning: Tuning;
  seed: string;
  tick: number;
};

const chan = (code: string, message: string, extra: Partial<BlockReason> = {}): BlockReason =>
  BlockReasonSchema.parse({ code, message, ...extra });

/** Hành động không thể hoàn tác — [BB] phải xác nhận trước. */
const KHONG_HOAN_TAC = new Set(['thu', 'phan']);

function laKhongHoanTac(ref: string, intent: Intent): boolean {
  if (KHONG_HOAN_TAC.has(ref)) return true;
  // Ý định cho phép gây hại cũng cần xác nhận.
  return intent.stance.harm === 'allow';
}

/**
 * Lập ActionPlan từ Intent.
 * [BB] 67.4 — validator kiểm luật, vật lý, tri thức, quyền truy cập, thời gian, invariant.
 */
export function lapKeHoach(nc: NgocCanhGiai): ActionPlan {
  napDungSan();
  const { intent, view } = nc;
  const doan = refDoanDuoc(intent.rawText);
  const blockedBy: BlockReason[] = [];
  const unknowns: string[] = [];
  const alternatives: string[] = [];

  // ── câu rỗng ──
  if (intent.rawText.trim() === '') {
    blockedBy.push(chan('CAU_RONG', 'Bạn chưa nói muốn làm gì.', { recoverable: true }));
  }

  // ── 1. Kiểm tri thức: mục tiêu chủ thể KHÔNG BIẾT thì không lập kế hoạch được ──
  // [BB] "Intent không dùng tri thức mù."
  for (const t of intent.targetRefs) {
    if (!view.entities.has(t.id)) {
      blockedBy.push(
        chan('KHONG_BIET_MUC_TIEU', `Bạn chưa từng nghe về "${t.label ?? t.id}".`, {
          missingRefs: [t],
        }),
      );
    }
  }
  // Mục tiêu chỉ nghe qua tin đồn: biết được, nhưng kế hoạch có ẩn số.
  for (const t of intent.targetRefs) {
    const e = view.entities.get(t.id);
    if (e?.mucRo === 'tin_don') {
      unknowns.push(`Điều bạn biết về "${e.ten}" chỉ là nghe kể lại, và có thể sai.`);
    }
  }

  // ── 2. Kiểm quyền theo tầng ──
  // [BB] 67.1 — sáu động từ là phép toán của SÁNG THẾ.
  if (doan.nguon === 'verb' && intent.mode !== 'sang_the') {
    const v = R.verb.lay(doan.ref);
    blockedBy.push(
      chan(
        'DONG_TU_SANG_THE',
        `"${v?.ten ?? doan.ref}" là phép của Sáng Thế Thần. Ở tầng này bạn phải làm điều đó bằng tay người, không bằng ý niệm.`,
        { recoverable: true },
      ),
    );
    alternatives.push('Tìm một cách làm trong tầm với của chủ thể hiện tại.');
  }

  // ── 3. Kiểm luật: luật nào đang cấm ý định này ──
  // [BB] 5.3 — phải trả về ID LUẬT cụ thể, không được trả chuỗi chung chung.
  if (intent.stance.harm === 'allow') {
    for (const l of view.laws) {
      // Chỉ luật chủ thể ĐƯỢC BIẾT mới chặn được một cách có nghĩa.
      if (l.mucRo === 'tin_don') continue;
      const camGiet = l.dienGiai.length > 0 || l.vanBan !== null;
      if (!camGiet) continue;
      blockedBy.push(
        chan('LUAT_CAM', `"${l.ten}" ràng buộc việc này: ${l.dienGiai || l.vanBan || ''}`, {
          lawId: l.id,
          recoverable: true,
        }),
      );
      alternatives.push(`Làm điều đó theo cách không chạm vào "${l.ten}".`);
      break;
    }
  }

  // ── 4. Bước kế hoạch ──
  const actionRef = doan.ref !== '' ? doan.ref : 'ung_bien';
  const steps =
    intent.rawText.trim() === ''
      ? []
      : [
          {
            id: `${intent.id}_s1`,
            actionRef,
            targetRefs: intent.targetRefs,
            preconditions: [],
            expectedEffects: [],
            duration: intent.horizon === 'immediate' ? 0 : 1,
            interruptible: true,
          },
        ];

  // Không khớp mồi nào → đường ứng biến (17.2), không phải từ chối.
  if (doan.ref === '' && intent.rawText.trim() !== '') {
    unknowns.push('Thế giới chưa có sẵn cách làm việc này; nó sẽ được ứng biến từ những gì đang có.');
  }

  return ActionPlanSchema.parse({
    id: `${intent.id}_plan`,
    intentId: intent.id,
    actorId: intent.actorId,
    steps,
    unknowns,
    blockedBy,
    alternatives,
    requiresConfirmation: laKhongHoanTac(actionRef, intent),
  });
}

/** Việc dài hơn một cảnh thì thành Project — Phần 68. */
export function nenThanhProject(intent: Intent): boolean {
  if (laDauHieuProject(intent.rawText)) return true;
  return intent.horizon === 'season' || intent.horizon === 'year' || intent.horizon === 'era';
}

function phamViProject(intent: Intent): Project['scope'] {
  if (intent.mode === 'sang_the') return 'cosmic';
  if (intent.mode === 'than') return 'divine';
  if (intent.horizon === 'era' || intent.horizon === 'year') return 'regional';
  return 'personal';
}

/**
 * Dựng Project từ Intent. Milestone và requirement được suy ra từ ẩn số của kế hoạch,
 * KHÔNG bịa ra từ không khí.
 */
export function taoProject(nc: NgocCanhGiai, plan: ActionPlan): Project {
  const { intent } = nc;
  const yeuCau: Project['requirements'] = [];

  for (const u of plan.unknowns) {
    yeuCau.push({ kind: 'knowledge', description: u, satisfied: false, sourceRefs: [] });
  }
  for (const b of plan.blockedBy) {
    yeuCau.push({
      kind: b.lawId ? 'law' : 'permission',
      description: b.message,
      satisfied: false,
      sourceRefs: b.missingRefs,
    });
  }
  if (yeuCau.length === 0) {
    yeuCau.push({
      kind: 'time',
      description: 'Việc này cần thời gian trong truyện để hoàn thành.',
      satisfied: false,
      sourceRefs: [],
    });
  }

  const milestones = yeuCau.map((r, i) => ({
    id: `${intent.id}_ms${i + 1}`,
    description: r.description,
    conditions: [],
    progress: 0,
    completedAtTick: null,
  }));

  return ProjectSchema.parse({
    id: `${intent.id}_project`,
    branchId: intent.branchId,
    ownerIds: [intent.actorId],
    goal: intent.goal,
    scope: phamViProject(intent),
    status: plan.blockedBy.length > 0 ? 'blocked' : 'active',
    locationIds: [],
    stakeholderIds: intent.targetRefs.map((t) => t.id),
    milestones,
    requirements: yeuCau,
    risks: [],
    nextTick: nc.tick + 1,
    eventIds: [],
  });
}

export type KetQuaGiai = {
  plan: ActionPlan;
  outcome: ActionOutcome;
  /** Event chưa áp — người gọi đưa qua `apDungEvent`. */
  events: readonly Event[];
  project: Project | null;
};

/**
 * Giải quyết một Intent thành Outcome + Event.
 *
 * [BB] Hàm này KHÔNG sửa state. Nó sinh Event; transaction mới là nơi state đổi.
 */
export function giaiQuyet(nc: NgocCanhGiai): KetQuaGiai {
  const { intent, view } = nc;
  const plan = lapKeHoach(nc);
  const rng = taoRng(`${nc.seed}#intent#${intent.id}`);
  const eventId = `ev_${intent.id}`;
  const patches: PatchOp[] = [];

  // ── 1. Bị chặn hoàn toàn ──
  if (plan.blockedBy.length > 0 && plan.steps.length === 0) {
    // [BB] Vẫn KHÔNG phải "không hiểu" — lý do cụ thể nằm trong blockedBy.
    return {
      plan,
      project: null,
      events: [],
      outcome: ActionOutcomeSchema.parse({
        intentId: intent.id,
        planId: plan.id,
        result: 'failure',
        notAchieved: [intent.goal],
        loiKe: plan.blockedBy.map((b) => b.message).join(' '),
      }),
    };
  }

  // ── 2. Việc dài → Project ──
  if (nenThanhProject(intent)) {
    const project = taoProject(nc, plan);
    const ev = taoEvent({
      id: eventId,
      branchId: intent.branchId,
      tick: nc.tick,
      loai: 'project_mo',
      actorIds: [intent.actorId],
      targetIds: intent.targetRefs.map((t) => t.id),
      causeEventIds: [],
      locationId: null,
      patches,
      visibility: intent.stance.secrecy === 'secret' ? 'bi_mat' : 'cong_khai',
      source: 'player',
      payload: { projectId: project.id, goal: intent.goal, rawText: intent.rawText },
    });
    return {
      plan,
      project,
      events: [ev],
      outcome: ActionOutcomeSchema.parse({
        intentId: intent.id,
        planId: plan.id,
        result: 'project_started',
        achieved: ['Bắt đầu một việc dài hơi.'],
        notAchieved: [intent.goal],
        eventIds: [ev.id],
        projectId: project.id,
        loiKe:
          plan.blockedBy.length > 0
            ? `Việc này cần thời gian, và hiện còn vướng: ${plan.blockedBy[0]?.message ?? ''}`
            : 'Việc này cần thời gian. Nó đã bắt đầu.',
      }),
    };
  }

  // ── 3. Hành động tức thời: resolve bằng RNG seeded + state thật ──
  const coAn = plan.unknowns.length > 0;
  const coVuong = plan.blockedBy.length > 0;
  const diemThuanLoi = (coAn ? 0 : 35) + (coVuong ? 0 : 35) + intent.confidence * 30;
  const thanhCong = rng.d100() <= Math.max(10, Math.min(95, diemThuanLoi));

  const ev = taoEvent({
    id: eventId,
    branchId: intent.branchId,
    tick: nc.tick,
    loai: 'hanh_dong',
    actorIds: [intent.actorId],
    targetIds: intent.targetRefs.map((t) => t.id),
    causeEventIds: [],
    locationId: null,
    patches,
    visibility: intent.stance.secrecy === 'secret' ? 'bi_mat' : 'cong_khai',
    source: 'player',
    payload: {
      rawText: intent.rawText,
      actionRef: plan.steps[0]?.actionRef ?? 'ung_bien',
      thanhCong,
    },
  });

  const tenMucTieu = intent.targetRefs.map((t) => view.entities.get(t.id)?.ten ?? t.label ?? t.id).join(', ');

  if (thanhCong && !coVuong) {
    return {
      plan,
      project: null,
      events: [ev],
      outcome: ActionOutcomeSchema.parse({
        intentId: intent.id,
        planId: plan.id,
        result: coAn ? 'partial' : 'success',
        achieved: [intent.goal],
        notAchieved: coAn ? plan.unknowns : [],
        eventIds: [ev.id],
        loiKe: coAn
          ? `Việc làm được một phần. ${plan.unknowns[0] ?? ''}`
          : tenMucTieu
            ? `Bạn làm điều đó với ${tenMucTieu}.`
            : 'Bạn làm điều đó.',
      }),
    };
  }

  // [BB] Thất bại phải có nguyên nhân TRONG THẾ GIỚI.
  const lyDo =
    plan.blockedBy[0]?.message ??
    plan.unknowns[0] ??
    'Hoàn cảnh lúc này không cho phép: thiếu người, thiếu thời gian, hoặc thiếu thứ cần có.';

  return {
    plan,
    project: null,
    events: [ev],
    outcome: ActionOutcomeSchema.parse({
      intentId: intent.id,
      planId: plan.id,
      result: 'partial',
      achieved: [],
      notAchieved: [intent.goal],
      eventIds: [ev.id],
      // Còn đường đi thì đề xuất, không dựng tường.
      newAffordances: plan.alternatives,
      loiKe: `Chưa xong. ${lyDo}`,
    }),
  };
}

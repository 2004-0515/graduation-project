import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const outputRoot = __dirname;
const svgDir = path.join(outputRoot, 'svg');
const pngDir = path.join(outputRoot, 'png');
const tempDir = path.join(repoRoot, '.tmp', 'playwright-diagrams');

process.env.TEMP = tempDir;
process.env.TMP = tempDir;

const style = `
  <style>
    text {
      font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
      fill: #111;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
    }
    .node-text {
      font-size: 15px;
      font-weight: 500;
    }
    .small-text {
      font-size: 13px;
    }
    .participant-text {
      font-size: 14px;
      font-weight: 700;
    }
    .message-text {
      font-size: 13px;
      font-weight: 500;
    }
    .guard-text {
      font-size: 13px;
      font-weight: 700;
    }
    .note-text {
      font-size: 12px;
    }
    .lifeline {
      stroke: #333;
      stroke-width: 1.4;
      stroke-dasharray: 8 6;
    }
    .frame {
      fill: none;
      stroke: #111;
      stroke-width: 1.6;
    }
    .box {
      fill: #fff;
      stroke: #111;
      stroke-width: 1.8;
    }
    .soft-box {
      fill: #fff;
      stroke: #111;
      stroke-width: 1.6;
      rx: 10;
      ry: 10;
    }
    .decision {
      fill: #fff;
      stroke: #111;
      stroke-width: 1.8;
    }
    .activation {
      fill: #fff;
      stroke: #111;
      stroke-width: 1.4;
    }
    .edge {
      fill: none;
      stroke: #111;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .return-edge {
      fill: none;
      stroke: #111;
      stroke-width: 1.4;
      stroke-dasharray: 8 5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .note {
      fill: #fff;
      stroke: #111;
      stroke-width: 1.4;
      stroke-dasharray: 6 4;
    }
    .caption {
      font-size: 12px;
      fill: #555;
    }
  </style>
`;

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrapText(text, maxChars = 12) {
  const rawLines = String(text).split('\n');
  const lines = [];

  for (const rawLine of rawLines) {
    let current = '';
    for (const char of rawLine) {
      current += char;
      if (current.length >= maxChars) {
        lines.push(current);
        current = '';
      }
    }
    if (current) {
      lines.push(current);
    }
    if (!rawLine) {
      lines.push('');
    }
  }

  return lines.length > 0 ? lines : [''];
}

function textBlock(x, y, text, className, options = {}) {
  const {
    maxChars = 12,
    lineHeight = 20,
    anchor = 'middle'
  } = options;
  const lines = Array.isArray(text) ? text : wrapText(text, maxChars);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  return `<text class="${className}" x="${x}" y="${startY}" text-anchor="${anchor}" dominant-baseline="middle">${tspans}</text>`;
}

function roundedRect(x, y, width, height, radius = 10, extraClass = 'soft-box') {
  return `<rect class="${extraClass}" x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ry="${radius}" />`;
}

function rect(x, y, width, height, extraClass = 'box') {
  return `<rect class="${extraClass}" x="${x}" y="${y}" width="${width}" height="${height}" />`;
}

function diamond(x, y, width, height) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const points = [
    [cx, y],
    [x + width, cy],
    [cx, y + height],
    [x, cy]
  ]
    .map(([px, py]) => `${px},${py}`)
    .join(' ');
  return `<polygon class="decision" points="${points}" />`;
}

function startNode(x, y) {
  return `<circle cx="${x}" cy="${y}" r="10" fill="#111" />`;
}

function endNode(x, y) {
  return [
    `<circle cx="${x}" cy="${y}" r="12" fill="#fff" stroke="#111" stroke-width="2" />`,
    `<circle cx="${x}" cy="${y}" r="7" fill="#111" />`
  ].join('');
}

function polyline(points, className = 'edge', marker = 'url(#callArrow)') {
  const value = points.map(([x, y]) => `${x},${y}`).join(' ');
  return `<polyline class="${className}" points="${value}" marker-end="${marker}" />`;
}

function line(x1, y1, x2, y2, className = 'edge', marker = 'url(#callArrow)') {
  return `<line class="${className}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="${marker}" />`;
}

function noteBox(x, y, width, height, text) {
  return [
    `<rect class="note" x="${x}" y="${y}" width="${width}" height="${height}" rx="8" ry="8" />`,
    textBlock(x + width / 2, y + height / 2, text, 'note-text', { maxChars: 20, lineHeight: 17 })
  ].join('');
}

function activityNode(node) {
  if (node.type === 'start') {
    return startNode(node.x, node.y);
  }
  if (node.type === 'end') {
    return endNode(node.x, node.y);
  }
  if (node.type === 'merge') {
    return diamond(node.x, node.y, node.w, node.h);
  }
  if (node.type === 'decision') {
    return [
      diamond(node.x, node.y, node.w, node.h),
      textBlock(node.x + node.w / 2, node.y + node.h / 2, node.text, 'small-text', { maxChars: node.maxChars || 8, lineHeight: 17 })
    ].join('');
  }
  const shape = node.square ? rect(node.x, node.y, node.w, node.h) : roundedRect(node.x, node.y, node.w, node.h, 12);
  return [
    shape,
    textBlock(node.x + node.w / 2, node.y + node.h / 2, node.text, 'node-text', { maxChars: node.maxChars || 12, lineHeight: 18 })
  ].join('');
}

function activityDiagram(diagram) {
  const body = [];
  body.push(`<text class="title" x="${diagram.width / 2}" y="38" text-anchor="middle">${escapeXml(diagram.title)}</text>`);
  body.push(`<text class="caption" x="${diagram.width / 2}" y="${diagram.height - 18}" text-anchor="middle">${escapeXml(diagram.caption)}</text>`);

  for (const node of diagram.nodes) {
    body.push(activityNode(node));
  }

  for (const edge of diagram.edges) {
    body.push(polyline(edge.points));
    if (edge.label) {
      body.push(`<text class="small-text" x="${edge.labelX}" y="${edge.labelY}" text-anchor="middle">${escapeXml(edge.label)}</text>`);
    }
  }

  if (diagram.notes) {
    for (const note of diagram.notes) {
      body.push(noteBox(note.x, note.y, note.w, note.h, note.text));
    }
  }

  return svgDocument(diagram.width, diagram.height, body.join(''));
}

function sequenceContext(diagram) {
  const margin = diagram.margin || 96;
  const top = 82;
  const bottom = diagram.height - 56;
  const gap = (diagram.width - margin * 2) / (diagram.participants.length - 1);
  const centers = new Map();

  diagram.participants.forEach((participant, index) => {
    centers.set(participant, margin + gap * index);
  });

  const body = [];
  body.push(`<text class="title" x="${diagram.width / 2}" y="38" text-anchor="middle">${escapeXml(diagram.title)}</text>`);
  body.push(`<text class="caption" x="${diagram.width / 2}" y="${diagram.height - 18}" text-anchor="middle">${escapeXml(diagram.caption)}</text>`);

  for (const participant of diagram.participants) {
    const centerX = centers.get(participant);
    const boxWidth = 144;
    const boxHeight = 42;
    body.push(rect(centerX - boxWidth / 2, top - boxHeight / 2, boxWidth, boxHeight));
    body.push(textBlock(centerX, top, participant, 'participant-text', { maxChars: 18, lineHeight: 18 }));
    body.push(`<line class="lifeline" x1="${centerX}" y1="${top + boxHeight / 2}" x2="${centerX}" y2="${bottom}" />`);
  }

  function x(name) {
    return centers.get(name);
  }

  function activation(participant, start, end, offset = 0) {
    const barWidth = 14;
    const centerX = x(participant);
    return rect(centerX - barWidth / 2 + offset * 6, start, barWidth, end - start, 'activation');
  }

  function message(from, to, y, label, options = {}) {
    const fromX = x(from);
    const toX = x(to);
    const className = options.returning ? 'return-edge' : 'edge';
    const marker = options.returning ? 'url(#returnArrow)' : 'url(#callArrow)';
    const labelX = fromX === toX ? fromX + 68 : (fromX + toX) / 2;
    const labelY = y - 10;

    if (fromX === toX) {
      const points = [
        [fromX, y],
        [fromX + 48, y],
        [fromX + 48, y + 28],
        [fromX, y + 28]
      ];
      return [
        polyline(points, className, marker),
        `<text class="message-text" x="${labelX}" y="${labelY}" text-anchor="start">${escapeXml(label)}</text>`
      ].join('');
    }

    return [
      line(fromX, y, toX, y, className, marker),
      `<text class="message-text" x="${labelX}" y="${labelY}" text-anchor="middle">${escapeXml(label)}</text>`
    ].join('');
  }

  function frame(x1Name, x2Name, y, height, kind, sections) {
    const left = x(x1Name) - 86;
    const right = x(x2Name) + 86;
    const width = right - left;
    const parts = [];
    parts.push(`<rect class="frame" x="${left}" y="${y}" width="${width}" height="${height}" />`);
    parts.push(`<text class="guard-text" x="${left + 10}" y="${y + 16}" text-anchor="start">${escapeXml(kind)}</text>`);

    let cursorY = y;
    sections.forEach((section, index) => {
      const guardY = index === 0 ? cursorY + 16 : cursorY + 16;
      parts.push(`<text class="small-text" x="${left + 46}" y="${guardY}" text-anchor="start">${escapeXml(section.guard)}</text>`);
      cursorY += section.height;
      if (index < sections.length - 1) {
        parts.push(`<line class="frame" x1="${left}" y1="${cursorY}" x2="${right}" y2="${cursorY}" />`);
      }
    });

    return parts.join('');
  }

  function note(xPos, yPos, width, height, text) {
    return noteBox(xPos, yPos, width, height, text);
  }

  return { body, x, activation, message, frame, note };
}

function sequenceDiagram(diagram, render) {
  const ctx = sequenceContext(diagram);
  render(ctx);
  return svgDocument(diagram.width, diagram.height, ctx.body.join(''));
}

function svgDocument(width, height, body) {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs>`,
    `<marker id="callArrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">`,
    `<path d="M1 1 L11 6 L1 11 Z" fill="#111" />`,
    `</marker>`,
    `<marker id="returnArrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">`,
    `<path d="M1 1 L11 6 L1 11" fill="none" stroke="#111" stroke-width="1.5" />`,
    `</marker>`,
    `</defs>`,
    style,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#fff" />`,
    body,
    `</svg>`
  ].join('');
}

function buildActivityDiagrams() {
  return [
    {
      file: '01-activity-order-create',
      title: '创建订单活动图',
      caption: 'Activity Diagram - Order Creation',
      width: 1160,
      height: 1440,
      nodes: [
        { type: 'start', x: 580, y: 80 },
        { x: 470, y: 118, w: 220, h: 58, text: '进入结算页面' },
        { x: 470, y: 214, w: 220, h: 58, text: '展示待结算商品' },
        { type: 'decision', x: 490, y: 314, w: 180, h: 96, text: '商品是否可结算？' },
        { x: 790, y: 326, w: 220, h: 70, text: '提示商品不可购买' },
        { type: 'end', x: 900, y: 442 },
        { x: 470, y: 446, w: 220, h: 70, text: '填写收货信息并确认订单' },
        { type: 'decision', x: 490, y: 554, w: 180, h: 96, text: '是否触发预算提醒？' },
        { x: 790, y: 566, w: 220, h: 70, text: '提示预算风险' },
        { type: 'decision', x: 810, y: 676, w: 180, h: 96, text: '是否继续下单？' },
        { x: 790, y: 804, w: 220, h: 70, text: '取消本次下单' },
        { type: 'end', x: 900, y: 920 },
        { type: 'merge', x: 562, y: 770, w: 36, h: 36 },
        { x: 470, y: 854, w: 220, h: 58, text: '提交订单' },
        { x: 470, y: 944, w: 220, h: 70, text: '校验订单信息' },
        { type: 'decision', x: 490, y: 1056, w: 180, h: 96, text: '订单校验通过？' },
        { x: 790, y: 1068, w: 220, h: 70, text: '提示下单失败原因' },
        { type: 'end', x: 900, y: 1184 },
        { x: 470, y: 1188, w: 220, h: 70, text: '生成待支付订单' },
        { x: 470, y: 1292, w: 220, h: 58, text: '跳转支付页面' },
        { type: 'end', x: 580, y: 1380 }
      ],
      edges: [
        { points: [[580, 90], [580, 118]] },
        { points: [[580, 176], [580, 214]] },
        { points: [[580, 272], [580, 314]] },
        { points: [[670, 362], [790, 362]], label: '否', labelX: 730, labelY: 348 },
        { points: [[900, 396], [900, 430]] },
        { points: [[580, 410], [580, 446]], label: '是', labelX: 618, labelY: 426 },
        { points: [[580, 516], [580, 554]] },
        { points: [[670, 602], [790, 602]], label: '是', labelX: 730, labelY: 588 },
        { points: [[580, 650], [580, 770]], label: '否', labelX: 618, labelY: 706 },
        { points: [[900, 636], [900, 676]] },
        { points: [[810, 724], [700, 724], [700, 788], [598, 788]], label: '是', labelX: 752, labelY: 710 },
        { points: [[900, 772], [900, 804]], label: '否', labelX: 938, labelY: 788 },
        { points: [[900, 874], [900, 908]] },
        { points: [[580, 806], [580, 854]] },
        { points: [[580, 912], [580, 944]] },
        { points: [[580, 1014], [580, 1056]] },
        { points: [[670, 1104], [790, 1104]], label: '否', labelX: 730, labelY: 1090 },
        { points: [[900, 1138], [900, 1172]] },
        { points: [[580, 1152], [580, 1188]], label: '是', labelX: 618, labelY: 1168 },
        { points: [[580, 1258], [580, 1292]] },
        { points: [[580, 1350], [580, 1368]] }
      ],
      notes: [
        { x: 120, y: 1198, w: 260, h: 70, text: '库存扣减发生在支付成功后，而不是创建订单时。' }
      ]
    },
    {
      file: '02-activity-wishlist-management',
      title: '想要清单管理活动图',
      caption: 'Activity Diagram - Wishlist Management',
      width: 1180,
      height: 1320,
      nodes: [
        { type: 'start', x: 590, y: 78 },
        { x: 480, y: 118, w: 220, h: 58, text: '点击加入想要清单' },
        { type: 'decision', x: 500, y: 214, w: 180, h: 96, text: '用户已登录？' },
        { x: 150, y: 226, w: 230, h: 70, text: '提示登录' },
        { type: 'end', x: 265, y: 344 },
        { x: 480, y: 344, w: 220, h: 70, text: '设置冷静期和原因' },
        { type: 'decision', x: 500, y: 452, w: 180, h: 96, text: '清单中已有该商品？' },
        { x: 150, y: 464, w: 230, h: 70, text: '提示商品已在清单中' },
        { type: 'end', x: 265, y: 584 },
        { x: 480, y: 586, w: 220, h: 70, text: '加入想要清单' },
        { x: 480, y: 688, w: 220, h: 58, text: '查看想要清单' },
        { type: 'decision', x: 500, y: 786, w: 180, h: 96, text: '冷静期已结束？' },
        { x: 150, y: 798, w: 230, h: 70, text: '显示剩余冷静时间' },
        { type: 'end', x: 265, y: 916 },
        { x: 800, y: 798, w: 220, h: 70, text: '显示购买入口' },
        { type: 'decision', x: 820, y: 918, w: 180, h: 96, text: '是否前往购买？' },
        { x: 480, y: 1050, w: 220, h: 70, text: '保留在清单中' },
        { x: 800, y: 1050, w: 220, h: 82, text: '标记已购买并跳转商品页', maxChars: 12 },
        { type: 'end', x: 590, y: 1240 }
      ],
      edges: [
        { points: [[590, 88], [590, 118]] },
        { points: [[590, 176], [590, 214]] },
        { points: [[500, 262], [380, 262]], label: '否', labelX: 440, labelY: 248 },
        { points: [[265, 296], [265, 332]] },
        { points: [[590, 310], [590, 344]], label: '是', labelX: 628, labelY: 326 },
        { points: [[590, 414], [590, 452]] },
        { points: [[500, 500], [380, 500]], label: '是', labelX: 440, labelY: 486 },
        { points: [[265, 534], [265, 572]] },
        { points: [[590, 548], [590, 586]], label: '否', labelX: 628, labelY: 564 },
        { points: [[590, 656], [590, 688]] },
        { points: [[590, 746], [590, 786]] },
        { points: [[500, 834], [380, 834]], label: '否', labelX: 440, labelY: 820 },
        { points: [[265, 868], [265, 904]] },
        { points: [[680, 834], [800, 834]], label: '是', labelX: 740, labelY: 820 },
        { points: [[910, 868], [910, 918]] },
        { points: [[820, 966], [700, 966]], label: '否', labelX: 760, labelY: 952 },
        { points: [[590, 1120], [590, 1240]] },
        { points: [[910, 1014], [910, 1050]], label: '是', labelX: 948, labelY: 1030 },
        { points: [[910, 1132], [910, 1240], [590, 1240]] }
      ],
      notes: [
        { x: 760, y: 678, w: 280, h: 70, text: '届满状态在读取清单时同步刷新。' }
      ]
    },
    {
      file: '03-activity-product-audit',
      title: '商品审核活动图',
      caption: 'Activity Diagram - Product Audit',
      width: 1120,
      height: 1120,
      nodes: [
        { type: 'start', x: 560, y: 78 },
        { x: 450, y: 118, w: 220, h: 58, text: '提交商品信息' },
        { type: 'decision', x: 470, y: 214, w: 180, h: 96, text: '提交信息有效？' },
        { x: 140, y: 226, w: 230, h: 70, text: '提示提交失败' },
        { type: 'end', x: 255, y: 344 },
        { x: 450, y: 344, w: 220, h: 70, text: '保存待审核商品' },
        { x: 450, y: 446, w: 220, h: 58, text: '通知管理员审核' },
        { x: 450, y: 540, w: 220, h: 58, text: '管理员查看商品信息' },
        { type: 'decision', x: 470, y: 636, w: 180, h: 96, text: '审核是否通过？' },
        { x: 770, y: 648, w: 220, h: 70, text: '更新为审核拒绝' },
        { x: 770, y: 756, w: 220, h: 58, text: '通知卖家审核拒绝' },
        { x: 450, y: 756, w: 220, h: 70, text: '更新为审核通过' },
        { x: 450, y: 864, w: 220, h: 58, text: '通知卖家审核通过' },
        { type: 'end', x: 560, y: 1010 }
      ],
      edges: [
        { points: [[560, 88], [560, 118]] },
        { points: [[560, 176], [560, 214]] },
        { points: [[470, 262], [370, 262]], label: '否', labelX: 420, labelY: 248 },
        { points: [[255, 296], [255, 332]] },
        { points: [[560, 310], [560, 344]], label: '是', labelX: 598, labelY: 326 },
        { points: [[560, 414], [560, 446]] },
        { points: [[560, 504], [560, 540]] },
        { points: [[560, 598], [560, 636]] },
        { points: [[650, 684], [770, 684]], label: '否', labelX: 710, labelY: 670 },
        { points: [[880, 718], [880, 756]] },
        { points: [[880, 814], [880, 998], [560, 998]] },
        { points: [[560, 732], [560, 756]], label: '是', labelX: 598, labelY: 748 },
        { points: [[560, 826], [560, 864]] },
        { points: [[560, 922], [560, 998]] }
      ]
    },
    {
      file: '04-activity-monthly-budget-setting',
      title: '月度预算设置活动图',
      caption: 'Activity Diagram - Monthly Budget Setting',
      width: 1120,
      height: 1120,
      nodes: [
        { type: 'start', x: 560, y: 78 },
        { x: 450, y: 118, w: 220, h: 58, text: '进入预算页面' },
        { x: 450, y: 214, w: 220, h: 70, text: '查看预算状态与消费情况', maxChars: 12 },
        { x: 450, y: 310, w: 220, h: 70, text: '填写预算金额和提醒阈值', maxChars: 12 },
        { type: 'decision', x: 470, y: 418, w: 180, h: 96, text: '金额符合前端规则？' },
        { x: 150, y: 430, w: 230, h: 70, text: '提示金额不合法' },
        { type: 'end', x: 265, y: 548 },
        { x: 450, y: 548, w: 220, h: 58, text: '提交预算设置请求' },
        { type: 'decision', x: 470, y: 646, w: 180, h: 96, text: '后端校验通过？' },
        { x: 770, y: 658, w: 220, h: 70, text: '提示保存失败原因' },
        { type: 'end', x: 880, y: 776 },
        { x: 450, y: 776, w: 220, h: 70, text: '保存或更新当月预算' },
        { x: 450, y: 882, w: 220, h: 58, text: '刷新预算状态' },
        { type: 'end', x: 560, y: 1000 }
      ],
      edges: [
        { points: [[560, 88], [560, 118]] },
        { points: [[560, 176], [560, 214]] },
        { points: [[560, 284], [560, 310]] },
        { points: [[560, 378], [560, 418]] },
        { points: [[470, 466], [380, 466]], label: '否', labelX: 425, labelY: 452 },
        { points: [[265, 500], [265, 536]] },
        { points: [[560, 514], [560, 548]], label: '是', labelX: 598, labelY: 530 },
        { points: [[560, 606], [560, 646]] },
        { points: [[650, 694], [770, 694]], label: '否', labelX: 710, labelY: 680 },
        { points: [[880, 728], [880, 764]] },
        { points: [[560, 742], [560, 776]], label: '是', labelX: 598, labelY: 758 },
        { points: [[560, 846], [560, 882]] },
        { points: [[560, 940], [560, 988]] }
      ],
      notes: [
        { x: 734, y: 188, w: 280, h: 70, text: '若当月无预算，系统沿用最近一次预算或自动创建默认预算。' }
      ]
    },
    {
      file: '05-activity-order-cancel',
      title: '订单取消活动图',
      caption: 'Activity Diagram - Order Cancellation',
      width: 1180,
      height: 1160,
      nodes: [
        { type: 'start', x: 590, y: 78 },
        { x: 480, y: 118, w: 220, h: 58, text: '发起取消订单' },
        { type: 'decision', x: 500, y: 214, w: 180, h: 96, text: '订单为待支付？' },
        { x: 160, y: 226, w: 230, h: 70, text: '直接取消订单' },
        { type: 'decision', x: 800, y: 214, w: 180, h: 96, text: '订单为已支付待发货？' },
        { x: 780, y: 346, w: 220, h: 70, text: '提交取消申请' },
        { x: 780, y: 448, w: 220, h: 58, text: '管理员审核取消申请' },
        { type: 'decision', x: 800, y: 544, w: 180, h: 96, text: '审核是否通过？' },
        { x: 480, y: 656, w: 220, h: 70, text: '驳回申请并恢复待发货' },
        { x: 780, y: 656, w: 220, h: 70, text: '恢复库存并取消订单' },
        { x: 840, y: 788, w: 230, h: 70, text: '提示当前状态不可取消' },
        { x: 480, y: 896, w: 220, h: 70, text: '展示最新订单状态' },
        { type: 'end', x: 590, y: 1050 }
      ],
      edges: [
        { points: [[590, 88], [590, 118]] },
        { points: [[590, 176], [590, 214]] },
        { points: [[500, 262], [390, 262]], label: '是', labelX: 445, labelY: 248 },
        { points: [[680, 262], [800, 262]], label: '否', labelX: 740, labelY: 248 },
        { points: [[275, 296], [275, 931], [480, 931]] },
        { points: [[890, 310], [890, 346]], label: '是', labelX: 928, labelY: 326 },
        { points: [[980, 262], [1060, 262], [1060, 788]], label: '否', labelX: 1020, labelY: 248 },
        { points: [[890, 416], [890, 448]] },
        { points: [[890, 506], [890, 544]] },
        { points: [[800, 592], [700, 592]], label: '否', labelX: 750, labelY: 578 },
        { points: [[890, 640], [890, 656]], label: '是', labelX: 928, labelY: 656 },
        { points: [[590, 726], [590, 896]] },
        { points: [[890, 726], [890, 931], [700, 931]] },
        { points: [[955, 858], [955, 931], [700, 931]] },
        { points: [[590, 966], [590, 1038]] }
      ]
    }
  ];
}

function buildSequenceDiagrams() {
  return [
    {
      file: '06-sequence-order-create',
      width: 1520,
      height: 980,
      participants: ['User', 'CheckoutView', 'OrderController', 'OrderService', 'AddressService', 'ProductService', 'OrderRepository'],
      title: '创建订单时序图',
      caption: 'Sequence Diagram - Order Creation (standard UML participants with activation bars)',
      render(ctx) {
        ctx.body.push(ctx.frame('OrderController', 'OrderRepository', 126, 746, 'alt', [
          { guard: '校验失败', height: 168 },
          { guard: '校验通过', height: 578 }
        ]));

        ctx.body.push(ctx.activation('CheckoutView', 110, 892));
        ctx.body.push(ctx.activation('OrderController', 150, 276));
        ctx.body.push(ctx.activation('OrderService', 184, 248));
        ctx.body.push(ctx.message('User', 'CheckoutView', 110, '点击提交订单'));
        ctx.body.push(ctx.message('CheckoutView', 'OrderController', 150, 'POST /orders'));
        ctx.body.push(ctx.message('OrderController', 'OrderService', 184, 'createOrder(request)'));
        ctx.body.push(ctx.message('OrderService', 'AddressService', 214, 'getAddressById(addressId)'));
        ctx.body.push(ctx.activation('AddressService', 214, 238));
        ctx.body.push(ctx.message('AddressService', 'OrderService', 238, '返回地址', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'OrderController', 262, 'ValidationException', { returning: true }));
        ctx.body.push(ctx.message('OrderController', 'CheckoutView', 276, '返回错误信息', { returning: true }));
        ctx.body.push(ctx.message('CheckoutView', 'User', 300, '提示地址/库存/状态异常', { returning: true }));

        ctx.body.push(ctx.activation('OrderController', 346, 828));
        ctx.body.push(ctx.activation('OrderService', 380, 796));
        ctx.body.push(ctx.activation('AddressService', 414, 440));
        ctx.body.push(ctx.activation('ProductService', 476, 640));
        ctx.body.push(ctx.activation('OrderRepository', 722, 754));
        ctx.body.push(ctx.message('CheckoutView', 'OrderController', 346, 'POST /orders'));
        ctx.body.push(ctx.message('OrderController', 'OrderService', 380, 'createOrder(request)'));
        ctx.body.push(ctx.message('OrderService', 'AddressService', 414, 'getAddressById(addressId)'));
        ctx.body.push(ctx.message('AddressService', 'OrderService', 440, '地址归属有效', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'ProductService', 476, 'getProductById(item.productId)'));
        ctx.body.push(ctx.message('ProductService', 'OrderService', 510, '商品信息/库存', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'ProductService', 546, '重复校验下一件商品'));
        ctx.body.push(ctx.message('ProductService', 'OrderService', 580, '商品可下单', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'OrderRepository', 722, 'save(order)'));
        ctx.body.push(ctx.message('OrderRepository', 'OrderService', 754, '返回待支付订单', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'OrderController', 796, 'OrderDto(status=PENDING_PAYMENT)', { returning: true }));
        ctx.body.push(ctx.message('OrderController', 'CheckoutView', 828, '200 订单创建成功', { returning: true }));
        ctx.body.push(ctx.message('CheckoutView', 'User', 860, '跳转支付页并清理结算快照', { returning: true }));

        ctx.body.push(ctx.note(1086, 654, 338, 84, '当前实现里，库存扣减与销量增加发生在支付成功阶段，而不是创建订单时。'));
      }
    },
    {
      file: '07-sequence-wishlist-management',
      width: 1500,
      height: 1020,
      participants: ['User', 'ProductDetailView', 'RationalController', 'RationalService', 'WishlistRepository', 'RationalView'],
      title: '想要清单管理时序图',
      caption: 'Sequence Diagram - Wishlist Management',
      render(ctx) {
        ctx.body.push(ctx.frame('RationalController', 'WishlistRepository', 126, 296, 'alt', [
          { guard: '活动记录已存在', height: 118 },
          { guard: '可创建新记录', height: 178 }
        ]));

        ctx.body.push(ctx.activation('ProductDetailView', 110, 954));
        ctx.body.push(ctx.activation('RationalController', 150, 402));
        ctx.body.push(ctx.activation('RationalService', 184, 370));
        ctx.body.push(ctx.activation('WishlistRepository', 218, 260));
        ctx.body.push(ctx.message('User', 'ProductDetailView', 110, '确认加入想要清单'));
        ctx.body.push(ctx.message('ProductDetailView', 'RationalController', 150, 'POST /wishlist'));
        ctx.body.push(ctx.message('RationalController', 'RationalService', 184, 'addToWishlist(productId, coolingDays, reason)'));
        ctx.body.push(ctx.message('RationalService', 'WishlistRepository', 218, 'findByUserIdAndProductIdAndStatusIn'));
        ctx.body.push(ctx.message('WishlistRepository', 'RationalService', 260, '返回已存在记录', { returning: true }));
        ctx.body.push(ctx.message('RationalService', 'RationalController', 294, 'ValidationException', { returning: true }));
        ctx.body.push(ctx.message('RationalController', 'ProductDetailView', 318, '返回“已在清单中”', { returning: true }));

        ctx.body.push(ctx.activation('RationalController', 372, 948));
        ctx.body.push(ctx.activation('RationalService', 404, 912));
        ctx.body.push(ctx.activation('WishlistRepository', 438, 528));
        ctx.body.push(ctx.message('ProductDetailView', 'RationalController', 372, 'POST /wishlist'));
        ctx.body.push(ctx.message('RationalController', 'RationalService', 404, 'addToWishlist(...)'));
        ctx.body.push(ctx.message('RationalService', 'WishlistRepository', 438, 'save(COOLING record)'));
        ctx.body.push(ctx.message('WishlistRepository', 'RationalService', 472, '返回 COOLING 记录', { returning: true }));
        ctx.body.push(ctx.message('RationalService', 'RationalController', 504, '创建成功', { returning: true }));
        ctx.body.push(ctx.message('RationalController', 'ProductDetailView', 528, '200 已加入想要清单', { returning: true }));
        ctx.body.push(ctx.message('User', 'RationalView', 620, '打开想要清单页'));
        ctx.body.push(ctx.message('RationalView', 'RationalController', 654, 'GET /wishlist'));
        ctx.body.push(ctx.message('RationalController', 'RationalService', 688, 'getWishlist()'));
        ctx.body.push(ctx.message('RationalService', 'WishlistRepository', 722, 'findCoolingExpired(now)'));
        ctx.body.push(ctx.message('WishlistRepository', 'RationalService', 756, '返回届满记录', { returning: true }));
        ctx.body.push(ctx.message('RationalService', 'WishlistRepository', 790, 'findByUserIdAndStatusIn'));
        ctx.body.push(ctx.message('WishlistRepository', 'RationalService', 824, '返回清单数据', { returning: true }));
        ctx.body.push(ctx.message('RationalService', 'RationalController', 858, 'Wishlist list', { returning: true }));
        ctx.body.push(ctx.message('RationalController', 'RationalView', 892, '返回 COOLING/READY 列表', { returning: true }));
        ctx.body.push(ctx.message('RationalView', 'User', 924, 'READY 项可继续前往购买', { returning: true }));

        ctx.body.push(ctx.note(1014, 676, 342, 88, '当前代码没有独立的定时任务和自动结束提醒；状态切换是在读取清单时通过 updateCoolingStatus 触发的。'));
      }
    },
    {
      file: '08-sequence-product-audit',
      width: 1500,
      height: 980,
      participants: ['Seller', 'MyProductsView', 'ProductController', 'ProductService', 'ProductRepository', 'AdminProductsView'],
      title: '商品审核时序图',
      caption: 'Sequence Diagram - Product Audit',
      render(ctx) {
        ctx.body.push(ctx.frame('ProductController', 'ProductRepository', 126, 250, 'alt', [
          { guard: '卖家提交商品', height: 250 }
        ]));
        ctx.body.push(ctx.frame('ProductController', 'ProductRepository', 428, 394, 'alt', [
          { guard: '审核通过', height: 194 },
          { guard: '审核拒绝', height: 200 }
        ]));

        ctx.body.push(ctx.activation('MyProductsView', 110, 856));
        ctx.body.push(ctx.activation('ProductController', 150, 790));
        ctx.body.push(ctx.activation('ProductService', 188, 752));
        ctx.body.push(ctx.activation('ProductRepository', 226, 718));

        ctx.body.push(ctx.message('Seller', 'MyProductsView', 110, '提交商品信息'));
        ctx.body.push(ctx.message('MyProductsView', 'ProductController', 150, 'POST /products/submit'));
        ctx.body.push(ctx.message('ProductController', 'ProductService', 188, 'saveProduct(auditStatus=0)'));
        ctx.body.push(ctx.message('ProductService', 'ProductRepository', 226, 'save(product)'));
        ctx.body.push(ctx.message('ProductRepository', 'ProductService', 260, '返回待审核商品', { returning: true }));
        ctx.body.push(ctx.message('ProductService', 'ProductController', 294, '商品已保存', { returning: true }));
        ctx.body.push(ctx.message('ProductController', 'MyProductsView', 328, '200 等待管理员审核', { returning: true }));
        ctx.body.push(ctx.message('MyProductsView', 'Seller', 360, '显示待审核状态', { returning: true }));

        ctx.body.push(ctx.message('AdminProductsView', 'ProductController', 462, 'POST /products/{id}/audit'));
        ctx.body.push(ctx.message('ProductController', 'ProductService', 496, 'auditProduct(id, auditStatus, remark)'));
        ctx.body.push(ctx.message('ProductService', 'ProductRepository', 530, 'findById + save'));
        ctx.body.push(ctx.message('ProductRepository', 'ProductService', 566, '返回商品记录', { returning: true }));
        ctx.body.push(ctx.message('ProductService', 'ProductRepository', 600, 'save(通过并转正价格)'));
        ctx.body.push(ctx.message('ProductRepository', 'ProductService', 634, '返回已通过商品', { returning: true }));
        ctx.body.push(ctx.message('ProductService', 'ProductController', 668, '审核通过结果', { returning: true }));
        ctx.body.push(ctx.message('ProductController', 'AdminProductsView', 700, '200 商品审核通过', { returning: true }));

        ctx.body.push(ctx.message('AdminProductsView', 'ProductController', 744, 'POST /products/{id}/audit'));
        ctx.body.push(ctx.message('ProductController', 'ProductService', 776, 'auditProduct(id, rejected, remark)'));
        ctx.body.push(ctx.message('ProductService', 'ProductRepository', 808, 'save(拒绝并清空待审核价格)'));
        ctx.body.push(ctx.message('ProductRepository', 'ProductService', 842, '返回已拒绝商品', { returning: true }));
        ctx.body.push(ctx.message('ProductService', 'ProductController', 874, '审核拒绝结果', { returning: true }));
        ctx.body.push(ctx.message('ProductController', 'AdminProductsView', 906, '200 商品审核未通过', { returning: true }));

        ctx.body.push(ctx.note(1026, 206, 312, 94, '真实实现中，新商品提交后会通知管理员；审核完成后也会通知卖家。这里保留主链路，把通知作为旁注说明。'));
      }
    },
    {
      file: '09-sequence-monthly-budget-setting',
      width: 1500,
      height: 980,
      participants: ['User', 'RationalView', 'RationalController', 'RationalService', 'BudgetRepository', 'OrderRepository'],
      title: '月度预算设置时序图',
      caption: 'Sequence Diagram - Monthly Budget Setting',
      render(ctx) {
        ctx.body.push(ctx.frame('RationalController', 'BudgetRepository', 126, 262, 'alt', [
          { guard: '未登录或金额无效', height: 136 },
          { guard: '保存成功', height: 126 }
        ]));
        ctx.body.push(ctx.frame('RationalController', 'OrderRepository', 442, 350, 'opt', [
          { guard: '保存成功后刷新预算状态', height: 350 }
        ]));

        ctx.body.push(ctx.activation('RationalView', 110, 844));
        ctx.body.push(ctx.activation('RationalController', 150, 790));
        ctx.body.push(ctx.activation('RationalService', 220, 756));
        ctx.body.push(ctx.activation('BudgetRepository', 252, 378));
        ctx.body.push(ctx.activation('OrderRepository', 612, 700));

        ctx.body.push(ctx.message('User', 'RationalView', 110, '填写预算并点击保存'));
        ctx.body.push(ctx.message('RationalView', 'RationalController', 150, 'POST /rational-consumption/budget'));
        ctx.body.push(ctx.message('RationalController', 'RationalView', 186, '401/422 错误', { returning: true }));
        ctx.body.push(ctx.message('RationalView', 'User', 220, '提示登录或金额异常', { returning: true }));

        ctx.body.push(ctx.message('RationalView', 'RationalController', 294, 'POST /rational-consumption/budget'));
        ctx.body.push(ctx.message('RationalController', 'RationalService', 330, 'setBudget(username, amount, threshold)'));
        ctx.body.push(ctx.message('RationalService', 'BudgetRepository', 364, 'findByUserIdAndBudgetMonth'));
        ctx.body.push(ctx.message('BudgetRepository', 'RationalService', 398, '返回已有记录或空', { returning: true }));
        ctx.body.push(ctx.message('RationalService', 'BudgetRepository', 432, 'save(currentMonth budget)'));
        ctx.body.push(ctx.message('BudgetRepository', 'RationalService', 466, '返回预算记录', { returning: true }));
        ctx.body.push(ctx.message('RationalService', 'RationalController', 500, '保存成功', { returning: true }));
        ctx.body.push(ctx.message('RationalController', 'RationalView', 534, '200 保存预算成功', { returning: true }));

        ctx.body.push(ctx.message('RationalView', 'RationalController', 612, 'GET /budget/status'));
        ctx.body.push(ctx.message('RationalController', 'RationalService', 646, 'getBudgetStatus(username)'));
        ctx.body.push(ctx.message('RationalService', 'BudgetRepository', 680, 'getCurrentBudget()'));
        ctx.body.push(ctx.message('BudgetRepository', 'RationalService', 714, '返回当月预算', { returning: true }));
        ctx.body.push(ctx.message('RationalService', 'OrderRepository', 748, 'findPaidOrdersOfCurrentMonth'));
        ctx.body.push(ctx.message('OrderRepository', 'RationalService', 782, '返回当月已支付订单', { returning: true }));
        ctx.body.push(ctx.message('RationalService', 'RationalController', 816, '预算使用情况', { returning: true }));
        ctx.body.push(ctx.message('RationalController', 'RationalView', 850, '返回预算状态', { returning: true }));
        ctx.body.push(ctx.message('RationalView', 'User', 882, '刷新进度条和剩余额度', { returning: true }));
      }
    },
    {
      file: '10-sequence-order-cancel',
      width: 1580,
      height: 1080,
      participants: ['User', 'OrdersView', 'OrderController', 'OrderService', 'OrderRepository', 'ProductService', 'AdminOrdersView'],
      title: '订单取消时序图',
      caption: 'Sequence Diagram - Order Cancellation',
      render(ctx) {
        ctx.body.push(ctx.frame('OrderController', 'OrderRepository', 126, 258, 'alt', [
          { guard: '待支付订单直接取消', height: 258 }
        ]));
        ctx.body.push(ctx.frame('OrderController', 'AdminOrdersView', 432, 508, 'alt', [
          { guard: '已支付待发货订单申请取消', height: 182 },
          { guard: '管理员审核取消申请', height: 326 }
        ]));
        ctx.body.push(ctx.frame('OrderService', 'ProductService', 694, 174, 'alt', [
          { guard: '同意取消', height: 86 },
          { guard: '拒绝取消', height: 88 }
        ]));

        ctx.body.push(ctx.activation('OrdersView', 110, 956));
        ctx.body.push(ctx.activation('OrderController', 150, 924));
        ctx.body.push(ctx.activation('OrderService', 188, 886));
        ctx.body.push(ctx.activation('OrderRepository', 226, 852));
        ctx.body.push(ctx.activation('ProductService', 742, 780));
        ctx.body.push(ctx.activation('AdminOrdersView', 620, 918));

        ctx.body.push(ctx.message('User', 'OrdersView', 110, '点击取消订单'));
        ctx.body.push(ctx.message('OrdersView', 'OrderController', 150, 'PUT /orders/{id}/cancel'));
        ctx.body.push(ctx.message('OrderController', 'OrderService', 188, 'cancelOrder(id, username)'));
        ctx.body.push(ctx.message('OrderService', 'OrderRepository', 226, 'findById + save(CANCELLED)'));
        ctx.body.push(ctx.message('OrderRepository', 'OrderService', 260, '返回已取消订单', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'OrderController', 294, '取消成功', { returning: true }));
        ctx.body.push(ctx.message('OrderController', 'OrdersView', 328, '200 订单取消成功', { returning: true }));
        ctx.body.push(ctx.message('OrdersView', 'User', 360, '刷新订单列表', { returning: true }));

        ctx.body.push(ctx.message('User', 'OrdersView', 466, '点击申请取消'));
        ctx.body.push(ctx.message('OrdersView', 'OrderController', 500, 'PUT /orders/{id}/request-cancel'));
        ctx.body.push(ctx.message('OrderController', 'OrderService', 534, 'requestCancelOrder(id, username)'));
        ctx.body.push(ctx.message('OrderService', 'OrderRepository', 568, 'save(CANCEL_REQUESTED)'));
        ctx.body.push(ctx.message('OrderRepository', 'OrderService', 602, '返回申请中订单', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'OrderController', 636, '申请提交成功', { returning: true }));
        ctx.body.push(ctx.message('OrderController', 'OrdersView', 670, '200 等待管理员审核', { returning: true }));

        ctx.body.push(ctx.message('AdminOrdersView', 'OrderController', 742, 'PUT /orders/{id}/review-cancel'));
        ctx.body.push(ctx.message('OrderController', 'OrderService', 776, 'reviewCancelRequest(id, approved)'));
        ctx.body.push(ctx.message('OrderService', 'OrderRepository', 810, 'findByIdWithDetails(order)'));
        ctx.body.push(ctx.message('OrderRepository', 'OrderService', 844, '返回申请中订单', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'ProductService', 742, 'increaseStock + decreaseSales'));
        ctx.body.push(ctx.message('ProductService', 'OrderService', 780, '库存与销量已回退', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'OrderRepository', 878, 'save(CANCELLED / PENDING_SHIPMENT)'));
        ctx.body.push(ctx.message('OrderRepository', 'OrderService', 912, '返回审核结果', { returning: true }));
        ctx.body.push(ctx.message('OrderService', 'OrderController', 946, '审核完成', { returning: true }));
        ctx.body.push(ctx.message('OrderController', 'AdminOrdersView', 980, '200 同意或拒绝结果', { returning: true }));
        ctx.body.push(ctx.message('AdminOrdersView', 'User', 1012, '订单状态更新可见', { returning: true }));

        ctx.body.push(ctx.note(1118, 720, 332, 104, '“同意取消”时才会恢复库存并回退销量；若管理员拒绝取消，订单状态恢复为 PENDING_SHIPMENT。'));
      }
    }
  ];
}

async function ensureDirectories() {
  await fs.mkdir(svgDir, { recursive: true });
  await fs.mkdir(pngDir, { recursive: true });
  await fs.mkdir(tempDir, { recursive: true });
}

async function writeTextFile(filePath, content) {
  await fs.writeFile(filePath, content, 'utf8');
}

async function renderPngs(diagrams) {
  const playwrightEntry = pathToFileURL(
    path.join(repoRoot, 'frontend', 'node_modules', 'playwright', 'index.mjs')
  ).href;
  const { chromium } = await import(playwrightEntry);
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ];

  let executablePath = null;
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      executablePath = candidate;
      break;
    } catch {
      // ignore
    }
  }

  if (!executablePath) {
    throw new Error('未找到可用的 Chrome/Edge 浏览器，无法导出 PNG。');
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath
  });

  try {
    for (const diagram of diagrams) {
      const svgPath = path.join(svgDir, `${diagram.file}.svg`);
      const pngPath = path.join(pngDir, `${diagram.file}.png`);
      const svg = await fs.readFile(svgPath, 'utf8');
      const context = await browser.newContext({
        viewport: {
          width: diagram.width,
          height: diagram.height
        },
        deviceScaleFactor: 2
      });
      const page = await context.newPage();
      await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;">${svg}</body></html>`);
      await page.screenshot({
        path: pngPath,
        omitBackground: false
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

function buildReadme(diagrams) {
  const rows = diagrams
    .map((diagram) => {
      const kind = diagram.file.includes('activity') ? '活动图' : '时序图';
      return `| ${diagram.file} | ${kind} | [svg/${diagram.file}.svg](./svg/${diagram.file}.svg) | [png/${diagram.file}.png](./png/${diagram.file}.png) |`;
    })
    .join('\n');

  return `# 论文图示导出\n\n` +
    `本目录包含 5 张活动图和 5 张时序图，对应当前仓库的真实实现。\n\n` +
    `- 时序图中人的参与者使用中文名称，系统类生命线使用英文 :ClassName 并加下划线。\n` +
    `- 时序图保留标准激活条，用于明确前端、控制器、服务和仓储层的处理区间。\n` +
    `- 图片为黑白论文风格，源码优先使用可编辑 SVG。\n\n` +
    `| 文件名 | 类型 | 可编辑源 | PNG 导出 |\n` +
    `| --- | --- | --- | --- |\n` +
    `${rows}\n`;
}

async function main() {
  await ensureDirectories();

  const activityDiagrams = buildActivityDiagrams();
  const sequenceDiagrams = buildSequenceDiagrams();
  const diagrams = [...activityDiagrams, ...sequenceDiagrams];

  for (const diagram of activityDiagrams) {
    await writeTextFile(path.join(svgDir, `${diagram.file}.svg`), activityDiagram(diagram));
  }

  for (const diagram of sequenceDiagrams) {
    await writeTextFile(path.join(svgDir, `${diagram.file}.svg`), sequenceDiagram(diagram, diagram.render));
  }

  await renderPngs(diagrams);
  await writeTextFile(path.join(outputRoot, 'README.md'), buildReadme(diagrams));

  console.log(`Generated ${diagrams.length} diagrams into ${outputRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

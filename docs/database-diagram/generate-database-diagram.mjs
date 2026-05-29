import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('docs/database-diagram');
fs.mkdirSync(outDir, { recursive: true });

const width = 3000;
const height = 2100;
const rowHeight = 19;
const headerHeight = 34;
const tableStrokeWidth = 1.2;

const tables = [
  {
    id: 'tb_user',
    label: 'tb_user（用户表）',
    x: 100,
    y: 560,
    w: 360,
    fields: [
      'id:BIGINT',
      'username:VARCHAR(50)',
      'password:VARCHAR(100)',
      'email:VARCHAR(100)',
      'phone:VARCHAR(20)',
      'avatar:VARCHAR(200)',
      'nickname:VARCHAR(50)',
      'points:INT',
      'growth_value:INT',
      'status:TINYINT',
      'role:VARCHAR(20)',
      'created_time:DATETIME',
      'updated_time:DATETIME'
    ]
  },
  {
    id: 'addresses',
    label: 'addresses（地址表）',
    x: 100,
    y: 950,
    w: 360,
    fields: [
      'id:BIGINT',
      'user_id:BIGINT',
      'name:VARCHAR(50)',
      'phone:VARCHAR(20)',
      'province:VARCHAR(50)',
      'city:VARCHAR(50)',
      'district:VARCHAR(50)',
      'detail:VARCHAR(200)',
      'is_default:BOOLEAN',
      'status:INT'
    ]
  },
  {
    id: 'tb_consumption_budget',
    label: 'tb_consumption_budget（消费预算表）',
    x: 80,
    y: 1280,
    w: 390,
    fields: [
      'id:BIGINT',
      'user_id:BIGINT',
      'monthly_budget:DECIMAL(10,2)',
      'budget_month:VARCHAR(6)',
      'alert_enabled:TINYINT',
      'alert_threshold:INT',
      'created_time:DATETIME',
      'updated_time:DATETIME'
    ]
  },
  {
    id: 'tb_category',
    label: 'tb_category（分类表）',
    x: 960,
    y: 120,
    w: 400,
    fields: [
      'id:BIGINT',
      'name:VARCHAR(50)',
      'description:VARCHAR(200)',
      'parent_id:BIGINT',
      'sort_order:INT',
      'icon:VARCHAR(100)',
      'status:TINYINT',
      'created_time:DATETIME',
      'updated_time:DATETIME'
    ]
  },
  {
    id: 'tb_product',
    label: 'tb_product（商品表）',
    x: 960,
    y: 470,
    w: 440,
    fields: [
      'id:BIGINT',
      'name:VARCHAR(100)',
      'description:TEXT',
      'category_id:BIGINT',
      'seller_id:BIGINT',
      'price:DECIMAL(10,2)',
      'original_price:DECIMAL(10,2)',
      'pending_price:DECIMAL(10,2)',
      'pending_original_price:DECIMAL(10,2)',
      'stock:INT',
      'sales:INT',
      'main_image:VARCHAR(200)',
      'status:TINYINT',
      'audit_status:TINYINT',
      'created_time:DATETIME'
    ]
  },
  {
    id: 'tb_cart',
    label: 'tb_cart（购物车表）',
    x: 600,
    y: 910,
    w: 340,
    fields: [
      'id:BIGINT',
      'user_id:BIGINT',
      'product_id:BIGINT',
      'quantity:INT',
      'selected:TINYINT',
      'created_time:DATETIME'
    ]
  },
  {
    id: 'tb_wishlist',
    label: 'tb_wishlist（心愿单表）',
    x: 600,
    y: 1130,
    w: 380,
    fields: [
      'id:BIGINT',
      'user_id:BIGINT',
      'product_id:BIGINT',
      'added_price:DECIMAL(10,2)',
      'cooling_days:INT',
      'cooling_end_time:DATETIME',
      'status:TINYINT',
      'reason:VARCHAR(500)',
      'created_time:DATETIME'
    ]
  },
  {
    id: 'tb_price_history',
    label: 'tb_price_history（价格历史表）',
    x: 1010,
    y: 1180,
    w: 390,
    fields: [
      'id:BIGINT',
      'product_id:BIGINT',
      'price:DECIMAL(10,2)',
      'original_price:DECIMAL(10,2)',
      'recorded_time:DATETIME',
      'change_type:VARCHAR(20)',
      'change_amount:DECIMAL(10,2)',
      'change_rate:DECIMAL(5,2)'
    ]
  },
  {
    id: 'tb_price_alert',
    label: 'tb_price_alert（降价提醒表）',
    x: 600,
    y: 1510,
    w: 430,
    fields: [
      'id:BIGINT',
      'user_id:BIGINT',
      'product_id:BIGINT',
      'target_price:DECIMAL(10,2)',
      'current_price:DECIMAL(10,2)',
      'status:TINYINT',
      'triggered_time:DATETIME',
      'triggered_price:DECIMAL(10,2)',
      'notified:TINYINT',
      'created_time:DATETIME',
      'updated_time:DATETIME'
    ]
  },
  {
    id: 'tb_order',
    label: 'tb_order（订单表）',
    x: 1600,
    y: 420,
    w: 440,
    fields: [
      'id:BIGINT',
      'order_no:VARCHAR(50)',
      'user_id:BIGINT',
      'total_amount:DECIMAL(10,2)',
      'pay_amount:DECIMAL(10,2)',
      'coupon_id:BIGINT',
      'coupon_discount:DECIMAL(10,2)',
      'payment_method:TINYINT',
      'payment_status:TINYINT',
      'order_status:TINYINT',
      'shipping_address:TEXT',
      'payment_time:DATETIME',
      'created_time:DATETIME'
    ]
  },
  {
    id: 'tb_order_item',
    label: 'tb_order_item（订单项表）',
    x: 1600,
    y: 860,
    w: 440,
    fields: [
      'id:BIGINT',
      'order_id:BIGINT',
      'product_id:BIGINT',
      'product_name:VARCHAR(100)',
      'product_price:DECIMAL(10,2)',
      'quantity:INT',
      'total_price:DECIMAL(10,2)',
      'product_image:VARCHAR(200)',
      'seller_id:BIGINT',
      'seller_name:VARCHAR(50)',
      'ship_status:TINYINT',
      'created_time:DATETIME'
    ]
  },
  {
    id: 'tb_review',
    label: 'tb_review（评价表）',
    x: 1600,
    y: 1280,
    w: 390,
    fields: [
      'id:BIGINT',
      'product_id:BIGINT',
      'user_id:BIGINT',
      'order_id:BIGINT',
      'order_item_id:BIGINT',
      'rating:INT',
      'content:VARCHAR(500)',
      'images:TEXT',
      'is_anonymous:TINYINT',
      'reply:VARCHAR(500)',
      'created_time:DATETIME'
    ]
  },
  {
    id: 'tb_coupon',
    label: 'tb_coupon（优惠券表）',
    x: 2260,
    y: 420,
    w: 430,
    fields: [
      'id:BIGINT',
      'name:VARCHAR(100)',
      'description:VARCHAR(500)',
      'type:TINYINT',
      'discount_amount:DECIMAL(10,2)',
      'discount_rate:DECIMAL(3,2)',
      'min_amount:DECIMAL(10,2)',
      'max_discount:DECIMAL(10,2)',
      'total_count:INT',
      'claimed_count:INT',
      'limit_per_user:INT',
      'start_time:DATETIME',
      'end_time:DATETIME',
      'status:TINYINT'
    ]
  },
  {
    id: 'tb_user_coupon',
    label: 'tb_user_coupon（用户优惠券表）',
    x: 2260,
    y: 860,
    w: 430,
    fields: [
      'id:BIGINT',
      'user_id:BIGINT',
      'coupon_id:BIGINT',
      'status:TINYINT',
      'order_id:BIGINT',
      'used_time:DATETIME',
      'created_time:DATETIME'
    ]
  }
];

for (const table of tables) {
  table.h = headerHeight + table.fields.length * rowHeight + 8;
}

const relationships = [
  { id: 'user_address', from: '1', to: 'N', points: [[280, 849], [280, 950]] },
  { id: 'user_budget', from: '1', to: 'N', points: [[100, 770], [50, 770], [50, 1370], [80, 1370]] },
  { id: 'user_product_seller', from: '1', to: 'N', points: [[460, 670], [960, 670]] },
  { id: 'user_cart', from: '1', to: 'N', points: [[460, 735], [560, 735], [560, 985], [600, 985]] },
  { id: 'user_wishlist', from: '1', to: 'N', points: [[460, 790], [560, 790], [560, 1235], [600, 1235]] },
  { id: 'user_price_alert', from: '1', to: 'N', points: [[460, 820], [540, 820], [540, 1635], [600, 1635]] },
  { id: 'user_order', from: '1', to: 'N', points: [[280, 560], [280, 60], [1820, 60], [1820, 420]] },
  { id: 'user_order_item_seller', from: '1', to: 'N', points: [[460, 610], [520, 610], [520, 50], [2740, 50], [2740, 840], [1820, 840], [1820, 860]] },
  { id: 'user_review', from: '1', to: 'N', points: [[100, 835], [70, 835], [70, 1880], [1795, 1880], [1795, 1531]] },
  { id: 'user_user_coupon', from: '1', to: 'N', points: [[460, 585], [520, 585], [520, 40], [2740, 40], [2740, 945], [2690, 945]] },

  { id: 'category_product', from: '1', to: 'N', points: [[1180, 333], [1180, 470]] },
  { id: 'product_cart', from: '1', to: 'N', points: [[960, 760], [880, 760], [880, 910]] },
  { id: 'product_wishlist', from: '1', to: 'N', points: [[970, 797], [970, 1235], [980, 1235]] },
  { id: 'product_price_history', from: '1', to: 'N', points: [[1180, 797], [1180, 1180]] },
  { id: 'product_price_alert', from: '1', to: 'N', points: [[960, 710], [565, 710], [565, 1510], [815, 1510]] },
  { id: 'product_order_item', from: '1', to: 'N', points: [[1400, 760], [1600, 760], [1600, 995]] },
  { id: 'product_review', from: '1', to: 'N', points: [[1400, 790], [1560, 790], [1560, 1320], [1600, 1320]] },

  { id: 'order_item', from: '1', to: 'N', points: [[1820, 709], [1820, 860]] },
  { id: 'order_review', from: '1', to: 'N', points: [[2040, 620], [2100, 620], [2100, 1400], [1990, 1400]] },
  { id: 'order_user_coupon', from: '1', to: 'N', points: [[2040, 550], [2170, 550], [2170, 945], [2260, 945]] },

  { id: 'coupon_order', from: '1', to: 'N', points: [[2260, 500], [2040, 500]] },
  { id: 'coupon_user_coupon', from: '1', to: 'N', points: [[2475, 728], [2475, 860]] }
];

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function unitVector(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  return [dx / length, dy / length];
}

function cardinalityPositions(points) {
  const start = points[0];
  const second = points[1];
  const previous = points.at(-2);
  const end = points.at(-1);
  const [sux, suy] = unitVector(start, second);
  const [tux, tuy] = unitVector(previous, end);
  const startLabel = Math.abs(sux) >= Math.abs(suy)
    ? [start[0] + sux * 14, start[1] - 18]
    : [start[0] + 8, start[1] + (suy > 0 ? 10 : -28)];
  const endLabel = Math.abs(tux) >= Math.abs(tuy)
    ? [end[0] - tux * 30, end[1] - 18]
    : [end[0] + 8, end[1] - tuy * 30];
  return [startLabel, endLabel];
}

function tableLabel(table) {
  const rows = table.fields.map((field) => esc(field.replace(':', ': '))).join('<br>');
  return `<div style="text-align:center;font-weight:bold;text-decoration:underline;">${esc(table.label)}</div><hr style="border:0;border-top:1px solid #000;margin:4px 0;"><div style="text-align:left;">${rows}</div>`;
}

function drawioLabel(id, x, y, value) {
  return `<mxCell id="${id}" value="${esc(value)}" style="text;html=1;strokeColor=none;fillColor=#ffffff;fontFamily=Arial,Microsoft YaHei;fontSize=11;fontStyle=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" parent="1" vertex="1"><mxGeometry x="${x}" y="${y}" width="22" height="18" as="geometry"/></mxCell>`;
}

function drawio() {
  const now = new Date().toISOString();
  const cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>'];

  for (const table of tables) {
    cells.push(`<mxCell id="${table.id}" value="${esc(tableLabel(table))}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontFamily=Arial,Microsoft YaHei;fontSize=12;align=left;verticalAlign=top;spacing=8;" parent="1" vertex="1"><mxGeometry x="${table.x}" y="${table.y}" width="${table.w}" height="${table.h}" as="geometry"/></mxCell>`);
  }

  for (const rel of relationships) {
    const [sx, sy] = rel.points[0];
    const [tx, ty] = rel.points.at(-1);
    const bendPoints = rel.points.slice(1, -1)
      .map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`)
      .join('');
    cells.push(`<mxCell id="${rel.id}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERone;startFill=0;startSize=10;endArrow=ERzeroToMany;endFill=0;endSize=10;strokeColor=#000000;strokeWidth=1;fontFamily=Arial,Microsoft YaHei;fontSize=11;" parent="1" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${sx}" y="${sy}" as="sourcePoint"/><mxPoint x="${tx}" y="${ty}" as="targetPoint"/>${bendPoints ? `<Array as="points">${bendPoints}</Array>` : ''}</mxGeometry></mxCell>`);
    const [[oneX, oneY], [manyX, manyY]] = cardinalityPositions(rel.points);
    cells.push(drawioLabel(`${rel.id}_one`, oneX, oneY, rel.from));
    cells.push(drawioLabel(`${rel.id}_many`, manyX, manyY, rel.to));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${now}" agent="diagrams.net" version="24.7.17" type="device">
  <diagram id="database-mapping" name="电商系统数据库关系映射图">
    <mxGraphModel dx="${width}" dy="${height}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${width}" pageHeight="${height}" math="0" shadow="0">
      <root>
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}

function text(x, y, value, options = {}) {
  const size = options.size ?? 13;
  const weight = options.weight ? ` font-weight="${options.weight}"` : '';
  const anchor = options.anchor ? ` text-anchor="${options.anchor}"` : '';
  const decoration = options.underline ? ' text-decoration="underline"' : '';
  return `<text x="${x}" y="${y}" font-family="Arial, Microsoft YaHei, SimSun" font-size="${size}"${weight}${anchor}${decoration} fill="#000">${esc(value)}</text>`;
}

function tableSvg(table) {
  const content = [
    `<rect x="${table.x}" y="${table.y}" width="${table.w}" height="${table.h}" fill="#fff" stroke="#000" stroke-width="${tableStrokeWidth}"/>`,
    `<line x1="${table.x}" y1="${table.y + headerHeight}" x2="${table.x + table.w}" y2="${table.y + headerHeight}" stroke="#000" stroke-width="1"/>`,
    text(table.x + table.w / 2, table.y + 22, table.label, { size: 15, weight: 'bold', anchor: 'middle', underline: true })
  ];
  table.fields.forEach((field, index) => {
    content.push(text(table.x + 10, table.y + headerHeight + 16 + index * rowHeight, field.replace(':', ': '), { size: 13 }));
  });
  return content.join('\n');
}

function svgLine(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1.1"/>`;
}

function svgCircle(cx, cy, radius) {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#fff" stroke="#000" stroke-width="1.1"/>`;
}

function svgOneMarker(p0, p1) {
  const [ux, uy] = unitVector(p0, p1);
  const nx = -uy;
  const ny = ux;
  return [4, 10].map((distance) => {
    const cx = p0[0] + ux * distance;
    const cy = p0[1] + uy * distance;
    const half = 8;
    return svgLine(cx - nx * half, cy - ny * half, cx + nx * half, cy + ny * half);
  }).join('\n');
}

function svgManyMarker(previous, endpoint) {
  const [ux, uy] = unitVector(endpoint, previous);
  const nx = -uy;
  const ny = ux;
  const stem = 13;
  const half = 7;
  const base = [endpoint[0] + ux * stem, endpoint[1] + uy * stem];
  const circle = [endpoint[0] + ux * 24, endpoint[1] + uy * 24];
  return [
    svgLine(endpoint[0], endpoint[1], base[0], base[1]),
    svgLine(endpoint[0], endpoint[1], base[0] + nx * half, base[1] + ny * half),
    svgLine(endpoint[0], endpoint[1], base[0] - nx * half, base[1] - ny * half),
    svgCircle(circle[0], circle[1], 5)
  ].join('\n');
}

function relationshipSvgLine(rel) {
  const line = rel.points.map(([x, y]) => `${x},${y}`).join(' ');
  return `<polyline points="${line}" fill="none" stroke="#000" stroke-width="1.1"/>`;
}

function relationshipSvgMarkers(rel) {
  const start = rel.points[0];
  const second = rel.points[1];
  const previous = rel.points.at(-2);
  const end = rel.points.at(-1);
  const [[oneX, oneY], [manyX, manyY]] = cardinalityPositions(rel.points);
  return [
    svgOneMarker(start, second),
    svgManyMarker(previous, end),
    text(oneX, oneY + 12, rel.from, { size: 12, weight: 'bold' }),
    text(manyX, manyY + 12, rel.to, { size: 12, weight: 'bold' })
  ].join('\n');
}

function svg() {
  const body = [
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#fff"/>`,
    ...relationships.map(relationshipSvgLine),
    ...tables.map(tableSvg),
    ...relationships.map(relationshipSvgMarkers)
  ].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${body}
</svg>`;
}

const drawioPath = path.join(outDir, 'ecommerce-database-relation.drawio');
const svgPath = path.join(outDir, 'ecommerce-database-relation.svg');
const dataPath = path.join(outDir, 'ecommerce-database-relation.json');
const readmePath = path.join(outDir, 'README.md');

fs.writeFileSync(drawioPath, drawio(), 'utf8');
fs.writeFileSync(svgPath, svg(), 'utf8');
fs.writeFileSync(dataPath, JSON.stringify({ width, height, rowHeight, headerHeight, tables, relationships }, null, 2), 'utf8');
fs.writeFileSync(readmePath, `# 电商系统数据库关系映射图

本图按论文示例图样式绘制：白底黑线、表名居中加粗并加下划线、字段采用 \`字段名: 数据库类型\` 格式，不显示 \`PK\`、\`AI\`、\`NN\` 等缩写。

本版采用 A3 横向分区布局，包含论文核心业务表以及价格历史、降价提醒、消费预算相关表：

- \`tb_user\`、\`addresses\`、\`tb_consumption_budget\`
- \`tb_category\`、\`tb_product\`、\`tb_cart\`、\`tb_wishlist\`
- \`tb_price_history\`、\`tb_price_alert\`
- \`tb_order\`、\`tb_order_item\`、\`tb_review\`
- \`tb_coupon\`、\`tb_user_coupon\`

图中绘制核心业务 1:N 关系，连线端点采用 ERD 常见样式：1 端为双竖线，N 端为圆圈加三叉脚，并通过分区和外围走线减少交叉，适合直接作为论文数据库关系映射图使用。
`, 'utf8');

console.log(JSON.stringify({ drawioPath, svgPath, dataPath, readmePath }, null, 2));

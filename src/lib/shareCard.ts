interface CardContent { name: string; score: number; title: string; summary: string; date: string }

// Draw a self-contained image: no birth information or third-party image requests.
export async function downloadFortuneCard(card: CardContent) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, '#4268ed');
  gradient.addColorStop(1, '#2448cb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = 'rgba(255,255,255,.13)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(870, 320, 310, 220, -.5, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px system-ui';
  ctx.fillText('✦  운의 흐름', 80, 110);
  ctx.font = '400 28px system-ui';
  ctx.fillText(card.date, 80, 164);
  ctx.font = '600 40px system-ui';
  ctx.fillText(`${card.name}님의 오늘`, 80, 300);
  ctx.font = '800 180px system-ui';
  ctx.fillText(String(card.score), 72, 505);
  ctx.font = '500 30px system-ui';
  ctx.fillText('오늘의 전체 흐름', 80, 565);
  ctx.fillStyle = '#c3f578';
  ctx.beginPath(); ctx.arc(845, 425, 115, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#243724';
  for (const x of [812, 875]) {ctx.beginPath(); ctx.ellipse(x, 405, 8, 13, 0, 0, Math.PI * 2); ctx.fill();}
  ctx.strokeStyle = '#243724'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(845, 435, 25, .15, Math.PI - .15); ctx.stroke();
  function wrapped(text: string, y: number, size: number, weight: number) {
    ctx!.fillStyle = '#ffffff';
    ctx!.font = `${weight} ${size}px system-ui`;
    let line = '';
    for (const char of text) {
      if (ctx!.measureText(line + char).width > 900) {
        ctx!.fillText(line, 80, y); y += size * 1.5; line = char;
      } else line += char;
    }
    if (line) ctx!.fillText(line, 80, y);
    return y + size * 1.5;
  }
  const nextY = wrapped(card.title, 700, 54, 800);
  wrapped(card.summary, nextY + 36, 35, 400);
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ctx.font = '500 25px system-ui';
  ctx.fillText('나를 조금 더 알고, 하루를 조금 더 가볍게.', 80, 1220);
  ctx.fillText('운세는 재미로 참고해주세요.  ·  YOUR DAILY LUCK', 80, 1270);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image unavailable')), 'image/png'));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = '오늘의-운세-카드.png'; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

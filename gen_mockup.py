from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 900
img = Image.new("RGB", (W, H), "#1c1c1e")
d = ImageDraw.Draw(img)

def try_font(size, bold=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

f_big   = try_font(22, True)
f_med   = try_font(16, True)
f_sm    = try_font(13)
f_sm_b  = try_font(13, True)
f_xs    = try_font(11)

def phone_frame(draw, x, y, w, h, label):
    r = 36
    draw.rounded_rectangle([x, y, x+w, y+h], radius=r, fill="#111", outline="#3a3a3c", width=2)
    draw.rounded_rectangle([x+8, y+8, x+w-8, y+h-8], radius=r-6, fill="#f2f2f7")
    # Dynamic island
    di_w, di_h = 80, 22
    draw.rounded_rectangle([x+w//2-di_w//2, y+14, x+w//2+di_w//2, y+14+di_h], radius=11, fill="#000")
    # status bar time
    draw.text((x+20, y+42), "9:41", font=try_font(12, True), fill="#000")
    draw.text((x+w-70, y+42), "● ᯤ 🔋", font=try_font(10), fill="#000")
    # label
    draw.text((x + w//2, y+h+14), label, font=f_xs, fill="#636366", anchor="mt")

def pill(draw, x, y, text, bg, fg):
    tw = draw.textlength(text, font=f_xs)
    pw = tw + 14
    draw.rounded_rectangle([x, y, x+pw, y+18], radius=9, fill=bg)
    draw.text((x+7, y+3), text, font=f_xs, fill=fg)
    return pw

def card(draw, x, y, w, h, fill="#fff", radius=12, left_bar=None):
    draw.rounded_rectangle([x, y, x+w, y+h], radius=radius, fill=fill)
    if left_bar:
        draw.rounded_rectangle([x, y+4, x+4, y+h-4], radius=2, fill=left_bar)

def icon_circle(draw, x, y, size, bg, text):
    draw.rounded_rectangle([x, y, x+size, y+size], radius=size//4, fill=bg)
    draw.text((x+size//2, y+size//2), text, font=try_font(size-10), fill="#000", anchor="mm")

# ─── SCREEN 1: Dashboard ───────────────────────────────────────────
px, py, pw, ph = 30, 40, 280, 760
phone_frame(d, px, py, pw, ph, "Напоминания")

ty = py + 68
d.text((px+20, ty), "Напоминания", font=f_big, fill="#000")
d.text((px+20, ty+28), "2 просрочено · 1 скоро", font=f_xs, fill="#8e8e93")

ty += 56
d.text((px+20, ty), "⚠ ПРОСРОЧЕНО", font=f_xs, fill="#8e8e93")
ty += 18

# overdue card 1
card(d, px+14, ty, pw-28, 62, fill="#fff2f2", left_bar=None)
d.rounded_rectangle([px+14, ty, px+18, ty+62], radius=2, fill="#ff3b30")
icon_circle(d, px+24, ty+11, 38, "#ffe5e5", "💉")
d.text((px+70, ty+10), "Nobivac Tricat", font=f_sm_b, fill="#000")
d.text((px+70, ty+27), "Мурзик · Прививка", font=f_xs, fill="#8e8e93")
d.text((px+pw-56, ty+10), "15.01.26", font=f_sm_b, fill="#ff3b30", anchor="rt")
d.text((px+pw-56, ty+27), "85 дн. назад", font=f_xs, fill="#8e8e93", anchor="rt")
ty += 70

# overdue card 2
card(d, px+14, ty, pw-28, 62, fill="#fff2f2")
d.rounded_rectangle([px+14, ty, px+18, ty+62], radius=2, fill="#ff3b30")
icon_circle(d, px+24, ty+11, 38, "#ffe5e5", "🪱")
d.text((px+70, ty+10), "Мильбемакс", font=f_sm_b, fill="#000")
d.text((px+70, ty+27), "Снежинка · От глистов", font=f_xs, fill="#8e8e93")
d.text((px+pw-56, ty+10), "01.03.26", font=f_sm_b, fill="#ff3b30", anchor="rt")
d.text((px+pw-56, ty+27), "40 дн. назад", font=f_xs, fill="#8e8e93", anchor="rt")
ty += 78

d.text((px+20, ty), "🔔 СКОРО", font=f_xs, fill="#8e8e93")
ty += 18

# upcoming card
card(d, px+14, ty, pw-28, 62, fill="#fff")
d.rounded_rectangle([px+14, ty, px+18, ty+62], radius=2, fill="#ff9500")
icon_circle(d, px+24, ty+11, 38, "#fff3e0", "🦟")
d.text((px+70, ty+10), "Advocate", font=f_sm_b, fill="#000")
d.text((px+70, ty+27), "Мурзик · От блох/клещей", font=f_xs, fill="#8e8e93")
d.text((px+pw-56, ty+10), "20.04.26", font=f_sm_b, fill="#ff9500", anchor="rt")
d.text((px+pw-56, ty+27), "Через 10 дн.", font=f_xs, fill="#8e8e93", anchor="rt")

# tab bar
tab_y = py + ph - 70
d.rectangle([px+8, tab_y, px+pw-8, py+ph-8], fill="white")
d.line([px+8, tab_y, px+pw-8, tab_y], fill="#d1d1d6", width=1)
d.text((px+pw//4, tab_y+8), "🔔", font=try_font(18), fill="#000", anchor="mt")
d.text((px+pw//4, tab_y+30), "Напоминания", font=f_xs, fill="#6c63ff", anchor="mt")
d.text((px+pw*3//4, tab_y+8), "🐾", font=try_font(18), fill="#000", anchor="mt")
d.text((px+pw*3//4, tab_y+30), "Мои коты", font=f_xs, fill="#8e8e93", anchor="mt")

# ─── SCREEN 2: Cats List ───────────────────────────────────────────
px2 = 340
phone_frame(d, px2, py, pw, ph, "Список котов")

ty = py + 68
d.text((px2+20, ty), "Мои коты", font=f_big, fill="#000")
# Add button
d.rounded_rectangle([px2+pw-90, ty, px2+pw-18, ty+26], radius=8, fill="#6c63ff")
d.text((px2+pw-54, ty+13), "+ Добавить", font=f_xs, fill="#fff", anchor="mm")

ty += 44

for name, breed_age, emoji, badges, bg_e in [
    ("Мурзик", "Мейн-кун · 3 г. 2 мес.", "🐱", [("⚠ 1 просрочено", "#ffe5e5", "#ff3b30"), ("🔔 1 скоро", "#fff3e0", "#ff9500")], "#f0eeff"),
    ("Снежинка", "Британская · 1 г. 8 мес.", "🐈\u200d⬛", [("⚠ 1 просрочено", "#ffe5e5", "#ff3b30")], "#f0eeff"),
    ("Рыжик", "Дворовый · 5 г.", "😺", [("✓ В порядке", "#e8faf0", "#34c759")], "#f0eeff"),
]:
    card(d, px2+14, ty, pw-28, 74, fill="#fff")
    # emoji box
    d.rounded_rectangle([px2+24, ty+11, px2+66, ty+53], radius=12, fill=bg_e)
    d.text((px2+45, ty+32), emoji, font=try_font(22), fill="#000", anchor="mm")
    d.text((px2+76, ty+12), name, font=f_sm_b, fill="#000")
    d.text((px2+76, ty+28), breed_age, font=f_xs, fill="#8e8e93")
    bx = px2+76
    for btxt, bbg, bfg in badges:
        w2 = pill(d, bx, ty+44, btxt, bbg, bfg)
        bx += w2 + 6
    d.text((px2+pw-30, ty+37), "›", font=try_font(20), fill="#c7c7cc", anchor="mm")
    ty += 82

# tab bar
tab_y = py + ph - 70
d.rectangle([px2+8, tab_y, px2+pw-8, py+ph-8], fill="white")
d.line([px2+8, tab_y, px2+pw-8, tab_y], fill="#d1d1d6", width=1)
d.text((px2+pw//4, tab_y+8), "🔔", font=try_font(18), fill="#000", anchor="mt")
d.text((px2+pw//4, tab_y+30), "Напоминания", font=f_xs, fill="#8e8e93", anchor="mt")
d.text((px2+pw*3//4, tab_y+8), "🐾", font=try_font(18), fill="#000", anchor="mt")
d.text((px2+pw*3//4, tab_y+30), "Мои коты", font=f_xs, fill="#6c63ff", anchor="mt")

# ─── SCREEN 3: Cat Detail ──────────────────────────────────────────
px3 = 650
phone_frame(d, px3, py, pw, ph, "Карточка кота")

# Gradient header (simulate with rect)
hdr_h = 190
d.rounded_rectangle([px3+8, py+8, px3+pw-8, py+8+hdr_h], radius=30, fill="#6c63ff")
d.rounded_rectangle([px3+8, py+8+hdr_h-20, px3+pw-8, py+8+hdr_h], radius=0, fill="#6c63ff")

d.text((px3+20, py+62), "‹ Коты", font=f_sm, fill="white")
# emoji box
d.rounded_rectangle([px3+20, py+86, px3+70, py+136], radius=16, fill="rgba(255,255,255,50)")
d.text((px3+45, py+111), "🐱", font=try_font(26), fill="#fff", anchor="mm")
d.text((px3+82, py+90), "Мурзик", font=try_font(20, True), fill="#fff")
d.text((px3+82, py+114), "Мейн-кун · 3 г. 2 мес.", font=f_xs, fill="rgba(255,255,255,180)")

# stats bar
sb_y = py + 144
d.rounded_rectangle([px3+16, sb_y, px3+pw-16, sb_y+40], radius=10, fill="rgba(255,255,255,50)")
for i, (val, lbl, col) in enumerate([("5", "Записей", "#fff"), ("1", "Просроч.", "#ff6b6b"), ("1", "Скоро", "#ffd06b")]):
    cx = px3+16 + (pw-32)//3 * i + (pw-32)//6
    d.text((cx, sb_y+8), val, font=try_font(16, True), fill=col, anchor="mt")
    d.text((cx, sb_y+26), lbl, font=try_font(10), fill="rgba(255,255,255,170)", anchor="mt")

ty = py + 8 + hdr_h + 12

for rec_name, rec_type, rec_done, rec_next, bar_col, date_col in [
    ("Nobivac Tricat", "💉 Прививка", "15.01.2025", "15.01.26", "#ff3b30", "#ff3b30"),
    ("Advocate",       "🦟 От блох/клещей", "20.03.2026", "20.04.26", "#ff9500", "#ff9500"),
    ("Мильбемакс",     "🪱 От глистов", "10.01.2026", "10.07.26", "#34c759", "#34c759"),
    ("Плановый осмотр","🏥 Ветеринар", "05.11.2025", "без повтора", "#c7c7cc", "#8e8e93"),
]:
    card(d, px3+14, ty, pw-28, 66, fill="#fff")
    d.rounded_rectangle([px3+14, ty+4, px3+18, ty+62], radius=2, fill=bar_col)
    d.text((px3+26, ty+16), rec_type.split()[0], font=try_font(20), fill="#000")
    d.text((px3+52, ty+10), rec_name, font=f_sm_b, fill="#000")
    d.text((px3+52, ty+26), rec_type, font=f_xs, fill="#8e8e93")
    d.text((px3+52, ty+40), "Проведено: " + rec_done, font=f_xs, fill="#8e8e93")
    d.text((px3+pw-30, ty+14), rec_next, font=try_font(11, True), fill=date_col, anchor="rt")
    d.text((px3+pw-30, ty+30), "след.", font=f_xs, fill="#8e8e93", anchor="rt")
    ty += 74

# FAB
fab_x, fab_y = px3+pw-56, py+ph-105
d.ellipse([fab_x, fab_y, fab_x+46, fab_y+46], fill="#6c63ff")
d.text((fab_x+23, fab_y+23), "+", font=try_font(26, True), fill="#fff", anchor="mm")

# tab bar
tab_y = py + ph - 70
d.rectangle([px3+8, tab_y, px3+pw-8, py+ph-8], fill="white")
d.line([px3+8, tab_y, px3+pw-8, tab_y], fill="#d1d1d6", width=1)
d.text((px3+pw//4, tab_y+8), "🔔", font=try_font(18), fill="#000", anchor="mt")
d.text((px3+pw//4, tab_y+30), "Напоминания", font=f_xs, fill="#8e8e93", anchor="mt")
d.text((px3+pw*3//4, tab_y+8), "🐾", font=try_font(18), fill="#000", anchor="mt")
d.text((px3+pw*3//4, tab_y+30), "Мои коты", font=f_xs, fill="#6c63ff", anchor="mt")

# ─── Legend ────────────────────────────────────────────────────────
lx, ly = 950, 80
d.rounded_rectangle([lx, ly, lx+210, ly+400], radius=16, fill="#2c2c2e")
d.text((lx+16, ly+16), "CatCare  iOS", font=f_med, fill="#fff")
d.text((lx+16, ly+40), "SwiftUI + SwiftData", font=f_xs, fill="#8e8e93")

items = [
    ("#ff3b30", "Просрочено", "Срок прошёл"),
    ("#ff9500", "Скоро", "До 30 дней"),
    ("#34c759", "В порядке", "Срок не скоро"),
    ("#636366", "Без повтора", "Разовая запись"),
]
iy = ly + 70
for col, title, sub in items:
    d.ellipse([lx+16, iy+3, lx+26, iy+13], fill=col)
    d.text((lx+34, iy), title, font=f_sm_b, fill="#fff")
    d.text((lx+34, iy+16), sub, font=f_xs, fill="#8e8e93")
    iy += 46

d.line([lx+16, iy+6, lx+194, iy+6], fill="#3a3a3c", width=1)
iy += 18

types = ["💉 Прививки", "🦟 От блох/клещей", "🪱 От глистов", "🏥 Ветеринар", "📋 Другое"]
for t in types:
    d.text((lx+16, iy), t, font=f_xs, fill="#8e8e93")
    iy += 18

iy += 8
d.text((lx+16, iy), "Push-уведомления", font=f_sm_b, fill="#fff")
d.text((lx+16, iy+18), "за 3 дня и в день X", font=f_xs, fill="#8e8e93")

out = "/home/user/test/mockup.png"
img.save(out, "PNG")
print(f"Saved: {out}")

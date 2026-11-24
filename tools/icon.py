from PIL import Image, ImageDraw
S = 1024
im = Image.new('RGB', (S, S), '#F6F0E4')
d = ImageDraw.Draw(im)
d.ellipse((560, 150, 900, 490), fill='#EB9757')                       # sun
d.polygon([(476, 880), (548, 880), (530, 330), (494, 330)], fill='#663515')  # trunk
for top, half, bottom in ((120, 120, 400), (250, 170, 560), (400, 215, 720)):  # three tiers of foliage
    d.polygon([(512, top), (512 + half, bottom), (512 - half, bottom)], fill='#223427')
d.rounded_rectangle((180, 872, 844, 900), radius=14, fill='#15313D')  # ground
for name, size in (('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180)):
    im.resize((size, size), Image.LANCZOS).save('icons/' + name)
print('icons ok')

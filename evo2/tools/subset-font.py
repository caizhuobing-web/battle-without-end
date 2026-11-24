"""把 Fusion Pixel 12px Proportional SC 裁剪成只含游戏用到的字，输出 font.woff2。
文案有增改后重新运行：python3 tools/subset-font.py <完整字体.woff2>
字体来源：npm 包 @fontsource/fusion-pixel-12px-proportional-sc（SIL OFL 1.1）。依赖：pip install fonttools brotli
"""
import glob, os, sys
from fontTools import subset

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("，。、；：？！（）「」《》·…—％×＋－→←↑↓")
for path in glob.glob(os.path.join(here, "*.js")) + glob.glob(os.path.join(here, "*.html")):
    chars |= set(open(path, encoding="utf-8").read())
chars = {c for c in chars if ord(c) >= 0x20}
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
font = subset.load_font(sys.argv[1], opts)
sub = subset.Subsetter(opts)
sub.populate(text="".join(sorted(chars)))
sub.subset(font)
out = os.path.join(here, "font.woff2")
subset.save_font(font, out, opts)
print(f"{len(chars)} chars -> {out} ({os.path.getsize(out)} bytes)")

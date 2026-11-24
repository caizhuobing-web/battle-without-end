"""把 Foozle《Cave and Desert Tileset》（CC0）的地下视差背景合成一张 256×112 的远景图，写成 ember/assets.js（base64）。
用法：python ember/tools/build-bg.py <解压后的 Underground/PNGs 目录>
来源：https://foozlecc.itch.io/cave-and-desert-tileset ，授权 CC0，见 ember/CREDITS.md。依赖：pip install pillow
"""
import base64, glob, io, os, sys
from PIL import Image

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ls = sorted(glob.glob(os.path.join(sys.argv[1], "*.png")))
assert len(ls) == 5, ls
comp = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
for f in reversed(ls):  # Layer 5 最远，Layer 1 最近
    comp.alpha_composite(Image.open(f).convert("RGBA"))
small = comp.resize((256, 256), Image.NEAREST).crop((0, 72, 256, 184)).convert("L")
buf = io.BytesIO()
small.save(buf, "PNG", optimize=True)
src = os.path.join(here, "assets-src", "cave-far.png")
open(src, "wb").write(buf.getvalue())
js = "/* 自动生成，勿手改。来源与授权见 ember/CREDITS.md。 */\n(function (G) {\n  G.EmberAssets = { caveFar: \"data:image/png;base64," + base64.b64encode(buf.getvalue()).decode() + "\" };\n})(typeof globalThis !== \"undefined\" ? globalThis : window);\n"
open(os.path.join(here, "assets.js"), "w", encoding="utf-8").write(js)
print(src, len(buf.getvalue()), "bytes; levels:", sorted(set(small.getdata())))

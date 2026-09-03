from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/upload/pasted_file_cynwol_image.png')
out_dir = Path('/home/ubuntu/planeo-fut/build')
out_dir.mkdir(parents=True, exist_ok=True)

image = Image.open(source).convert('RGB')
width, height = image.size
# Recorte cuadrado centrado sobre el portapapeles, manteniendo el motivo completo.
side = min(width, height)
left = (width - side) // 2
upper = max(0, (height - side) // 2 - 10)
upper = min(upper, height - side)
cropped = image.crop((left, upper, left + side, upper + side))
icon = cropped.resize((1024, 1024), Image.Resampling.LANCZOS)
icon.save(out_dir / 'icon.png', optimize=True)
icon.save(out_dir / 'icon.ico', sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
print(f'created {out_dir / "icon.png"} and {out_dir / "icon.ico"} from {image.size}, crop={(left, upper, left+side, upper+side)}')

import os
from PIL import Image

def generate_icons(source_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        with Image.open(source_path) as img:
            # Generate sizes for PWA
            sizes = [72, 96, 128, 144, 152, 192, 384, 512]
            for size in sizes:
                resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
                
                # Save as PNG
                png_path = os.path.join(output_dir, f'icon-{size}.png')
                resized_img.save(png_path, format='PNG')
                
                # Save as WebP
                webp_path = os.path.join(output_dir, f'icon-{size}.webp')
                resized_img.save(webp_path, format='WEBP', quality=90)
                
                print(f"Generated {size}x{size} icons")

            # Generate maskable 512x512
            # For maskable, we assume the logo is already centered and padded.
            # If it's a tight crop, we might need to add padding, but we'll just resize it.
            maskable_png_path = os.path.join(output_dir, 'icon-512-maskable.png')
            img.resize((512, 512), Image.Resampling.LANCZOS).save(maskable_png_path, format='PNG')
            
            maskable_webp_path = os.path.join(output_dir, 'icon-512-maskable.webp')
            img.resize((512, 512), Image.Resampling.LANCZOS).save(maskable_webp_path, format='WEBP', quality=90)
            
            print("Generated maskable icons")

            # Generate favicon.ico (multiple sizes)
            favicon_path = os.path.join(os.path.dirname(output_dir), 'favicon.ico')
            icon_sizes = [(16, 16), (32, 32), (48, 48)]
            img.save(favicon_path, format='ICO', sizes=icon_sizes)
            print("Generated favicon.ico in img folder")

    except Exception as e:
        print(f"Error generating icons: {e}")

if __name__ == "__main__":
    source_logo = "assets/img/LogoApp.png"
    output_directory = "assets/img/icons"
    generate_icons(source_logo, output_directory)

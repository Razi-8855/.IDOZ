import os
from PIL import Image, ImageOps, ImageChops

def extract_logo():
    input_path = r"c:\Users\razi7\.bee\assets\logo_sheet.jpg"
    output_dir = r"c:\Users\razi7\.bee\assets"
    
    if not os.path.exists(input_path):
        print(f"Error: Input file {input_path} does not exist.")
        return
        
    print(f"Loading logo sheet from {input_path}...")
    img = Image.open(input_path)
    width, height = img.size
    print(f"Image dimensions: {width}x{height}")
    
    # We want to crop the central ornamental bee.
    # Looking at the logo sheet, the bee is centrally aligned.
    # Let's crop the central 60% horizontally and from 25% to 65% vertically to isolate the bee.
    left = int(width * 0.25)
    top = int(height * 0.25)
    right = int(width * 0.75)
    bottom = int(height * 0.65)
    
    print(f"Cropping central area: ({left}, {top}) to ({right}, {bottom})")
    cropped = img.crop((left, top, right, bottom))
    cropped.save(os.path.join(output_dir, "cropped_raw.png"))
    
    # Convert to grayscale to analyze pixels
    gray = cropped.convert("L")
    
    # Invert grayscale so the bee is white (high values) and background is black (low values)
    inverted_gray = ImageOps.invert(gray)
    
    # Find the bounding box of the white elements (the bee) to get a tight crop
    bbox = inverted_gray.getbbox()
    if bbox:
        print(f"Found tight bounding box: {bbox}")
        # Add some padding around the bounding box (e.g., 10 pixels)
        pad = 10
        bbox_padded = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(cropped.width, bbox[2] + pad),
            min(cropped.height, bbox[3] + pad)
        )
        logo_region = cropped.crop(bbox_padded)
        logo_gray = gray.crop(bbox_padded)
    else:
        print("Warning: Could not find bounding box, using cropped region directly.")
        logo_region = cropped
        logo_gray = gray

    # Create transparent versions
    # For a dark logo on light background:
    # Alpha channel should be the inverse of brightness (white = 0 alpha, black = 255 alpha)
    alpha = ImageOps.invert(logo_gray)
    
    # We'll make the RGB channels black (0, 0, 0) and use alpha for the shape
    dark_logo = Image.new("RGBA", logo_region.size, (74, 53, 56, 0)) # Old Burgundy #4A3538 = (74, 53, 56)
    dark_logo.putalpha(alpha)
    
    # Let's save the dark logo in Burgundy color
    dark_logo_path = os.path.join(output_dir, "logo_dark.png")
    dark_logo.save(dark_logo_path, "PNG")
    print(f"Saved luxury burgundy logo to {dark_logo_path}")
    
    # For a light/white logo on dark background (e.g. for Burgundy backgrounds):
    # We'll make the RGB channels white Smoke #F6F3F3 = (246, 243, 243) or Gold #D4AF37 = (212, 175, 55)
    # The prompt mentions: Primary: Isabelline #EEE8E8, Secondary: French Nude #DED1D1, Accent: Raspberry Glace #895669, Dark Neutral: Old Burgundy #4A3538, Light Neutral: White Smoke #F6F3F3
    # Let's create:
    # 1. A White Smoke version
    white_logo = Image.new("RGBA", logo_region.size, (246, 243, 243, 0))
    white_logo.putalpha(alpha)
    white_logo_path = os.path.join(output_dir, "logo_light.png")
    white_logo.save(white_logo_path, "PNG")
    print(f"Saved light/white smoke logo to {white_logo_path}")
    
    # 2. A gold/bronze-ish version to represent "Zari" (gold metallic thread embroidery)
    # Gold: #D4AF37 = (212, 175, 55) or a beautiful warm metallic tone: French Nude / brass.
    # Let's make an accent version in Raspberry Glace #895669 = (137, 86, 105)
    raspberry_logo = Image.new("RGBA", logo_region.size, (137, 86, 105, 0))
    raspberry_logo.putalpha(alpha)
    raspberry_logo_path = os.path.join(output_dir, "logo_accent.png")
    raspberry_logo.save(raspberry_logo_path, "PNG")
    print(f"Saved raspberry accent logo to {raspberry_logo_path}")

    # Let's also do a gold/zari color logo for a metallic luxury feel:
    # Zari color: #C5A059 (Gold Zari) = (197, 160, 89)
    gold_logo = Image.new("RGBA", logo_region.size, (197, 160, 89, 0))
    gold_logo.putalpha(alpha)
    gold_logo_path = os.path.join(output_dir, "logo_gold.png")
    gold_logo.save(gold_logo_path, "PNG")
    print(f"Saved gold Zari logo to {gold_logo_path}")

if __name__ == "__main__":
    extract_logo()

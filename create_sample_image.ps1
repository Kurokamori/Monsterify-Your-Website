# Create a simple colored rectangle as a sample image
Add-Type -AssemblyName System.Drawing

# Create a bitmap with the specified dimensions
$width = 800
$height = 400
$bmp = New-Object System.Drawing.Bitmap $width, $height

# Create a graphics object from the bitmap
$graphics = [System.Drawing.Graphics]::FromImage($bmp)

# Fill the background with a gradient
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($width, $height)),
    [System.Drawing.Color]::FromArgb(255, 200, 50, 0),  # Fiery orange-red
    [System.Drawing.Color]::FromArgb(255, 255, 150, 0)  # Bright orange-yellow
)
$graphics.FillRectangle($brush, 0, 0, $width, $height)

# Add text
$font = New-Object System.Drawing.Font("Arial", 48, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("Agni Pradesh", $font, $textBrush, 
    (New-Object System.Drawing.RectangleF(0, 0, $width, $height)), 
    $stringFormat)

# Add a subtitle
$subtitleFont = New-Object System.Drawing.Font("Arial", 24)
$graphics.DrawString("Land of Fire", $subtitleFont, $textBrush, 
    (New-Object System.Drawing.RectangleF(0, 100, $width, $height)), 
    $stringFormat)

# Save the bitmap as a PNG file
$bmp.Save("public\images\locations\areas\agni_pradesh.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create a region image
$bmp2 = New-Object System.Drawing.Bitmap $width, $height
$graphics2 = [System.Drawing.Graphics]::FromImage($bmp2)

# Fill with a different gradient
$brush2 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($width, $height)),
    [System.Drawing.Color]::FromArgb(255, 0, 100, 200),  # Deep blue
    [System.Drawing.Color]::FromArgb(255, 100, 200, 255)  # Light blue
)
$graphics2.FillRectangle($brush2, 0, 0, $width, $height)

# Add text
$graphics2.DrawString("Conocoo Island Mainland", $font, $textBrush, 
    (New-Object System.Drawing.RectangleF(0, 0, $width, $height)), 
    $stringFormat)

# Add a subtitle
$graphics2.DrawString("Explore the mainland", $subtitleFont, $textBrush, 
    (New-Object System.Drawing.RectangleF(0, 100, $width, $height)), 
    $stringFormat)

# Save the bitmap as a PNG file
$bmp2.Save("public\images\locations\regions\conocoo-island-mainland.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create a location image
$bmp3 = New-Object System.Drawing.Bitmap $width, $height
$graphics3 = [System.Drawing.Graphics]::FromImage($bmp3)

# Fill with a different gradient
$brush3 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($width, $height)),
    [System.Drawing.Color]::FromArgb(255, 255, 50, 0),  # Bright red
    [System.Drawing.Color]::FromArgb(255, 255, 200, 0)  # Bright yellow
)
$graphics3.FillRectangle($brush3, 0, 0, $width, $height)

# Add text
$graphics3.DrawString("Fire Temple", $font, $textBrush, 
    (New-Object System.Drawing.RectangleF(0, 0, $width, $height)), 
    $stringFormat)

# Add a subtitle
$graphics3.DrawString("Sacred flames burn eternally", $subtitleFont, $textBrush, 
    (New-Object System.Drawing.RectangleF(0, 100, $width, $height)), 
    $stringFormat)

# Save the bitmap as a PNG file
$bmp3.Save("public\images\locations\locations\fire_temple.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Clean up
$graphics.Dispose()
$bmp.Dispose()
$graphics2.Dispose()
$bmp2.Dispose()
$graphics3.Dispose()
$bmp3.Dispose()

Write-Host "Sample images created successfully!"

Add-Type -AssemblyName System.Drawing
$public = Join-Path $PSScriptRoot "..\public" | Resolve-Path
$src = Join-Path $public "doctor_icon.png"
$dst = Join-Path $public "doctor_cursor.png"
$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.DrawImage($img, 0, 0, 32, 32)
$g.Dispose()
$img.Dispose()
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Wrote $dst"

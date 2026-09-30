Add-Type -AssemblyName System.Drawing

# Símbolo Cauce: dos arcos "C" azules con extremos redondeados sobre transparente.
function New-CauceIcon([int]$size, [string]$path, [double]$scale = 0.78) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $center = $size / 2.0
  # El SVG usa un círculo desplazado a la izquierda: centro en x=42/120.
  $cx = $center - ($size * 0.15)
  $cy = $center
  $outer = ($size * 0.46 * $scale)
  $inner = $outer * 0.52

  $widthOuter = [Math]::Max(2.0, $size * 0.092)
  $widthInner = $widthOuter

  $blue = [System.Drawing.Color]::FromArgb(255, 56, 189, 248)
  $blueDeep = [System.Drawing.Color]::FromArgb(255, 3, 105, 161)
  $penOuter = New-Object System.Drawing.Pen($blueDeep, [float]$widthOuter)
  $penInner = New-Object System.Drawing.Pen($blue, [float]($widthInner * 0.9))
  $penOuter.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penOuter.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penInner.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penInner.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  # Arco exterior: apertura hacia la derecha (de ~50° a ~310°)
  $g.DrawArc($penOuter, ($cx - $outer), ($cy - $outer), ($outer * 2), ($outer * 2), 50, 260)
  # Arco interior
  $g.DrawArc($penInner, ($cx - $inner), ($cy - $inner), ($inner * 2), ($inner * 2), 50, 260)

  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "OK $path ($size x $size)"
}

New-CauceIcon 512 "public\icons\icon-512x512.png" 1.0
New-CauceIcon 192 "public\icons\icon-192x192.png" 1.0
New-CauceIcon 512 "public\icons\icon-512x512-maskable.png" 0.62
New-CauceIcon 180 "public\icons\apple-touch-icon.png" 0.9
New-CauceIcon 256 "public\icon.png" 1.0

# favicon.ico con 16/32/48 embebidos
$ico32 = New-Object System.Drawing.Bitmap(32, 32)
$g32 = [System.Drawing.Graphics]::FromImage($ico32)
$g32.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g32.Clear([System.Drawing.Color]::Transparent)
$cx = 16 - (32 * 0.075); $cy = 16
$outer = 32 * 0.46 * 0.85
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 3, 105, 161), 3.0)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g32.DrawArc($pen, ($cx - $outer), ($cy - $outer), ($outer * 2), ($outer * 2), 50, 260)
$g32.Dispose()

$ico = New-Object System.Drawing.Icon
$ico32.Save([System.Drawing.Color]::Transparent) | Out-Null
# System.Drawing no guarda .ico multi-tamaño: guardamos el PNG de 32 como .ico (los navegadores lo aceptan).
$ico32.Save("public\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Png)
$ico32.Dispose()
Write-Host "OK public\favicon.ico"

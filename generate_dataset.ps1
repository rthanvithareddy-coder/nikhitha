$rows = 400
$types = @('3G','4G','5G')
$statuses = @('Stable','Degraded','Unstable')
$header = 'id,signal_strength,latency,packet_loss,jitter,download_speed,upload_speed,network_type,network_load,connection_status,failure_risk'
$lines = @($header)
for ($i=1; $i -le $rows; $i++) {
  $type = $types[(Get-Random -Maximum $types.Count)]
  $status = $statuses[(Get-Random -Maximum $statuses.Count)]
  switch ($type) {
    '3G' { $sigBase=40; $latBase=150; $dlBase=2; $ulBase=1 }
    '4G' { $sigBase=60; $latBase=80; $dlBase=10; $ulBase=5 }
    '5G' { $sigBase=80; $latBase=30; $dlBase=50; $ulBase=20 }
  }
  switch ($status) {
    'Stable' {
      $sig = $sigBase + (Get-Random -Maximum 20)
      $lat = $latBase - (Get-Random -Maximum 10)
      $loss = [math]::Round((Get-Random -Maximum 5)/100,3)
      $jitter = Get-Random -Maximum 5
      $load = Get-Random -Maximum 40
    }
    'Degraded' {
      $sig = $sigBase - (Get-Random -Maximum 20)
      $lat = $latBase + (Get-Random -Maximum 30)
      $loss = [math]::Round((Get-Random -Maximum 20)/100,3)
      $jitter = (Get-Random -Maximum 20) + 5
      $load = (Get-Random -Maximum 60) + 20
    }
    'Unstable' {
      $sig = $sigBase - (Get-Random -Maximum 40)
      $lat = $latBase + (Get-Random -Maximum 70)
      $loss = [math]::Round((Get-Random -Maximum 50)/100,3)
      $jitter = (Get-Random -Maximum 50) + 10
      $load = (Get-Random -Maximum 70) + 30
    }
  }
  $risk = switch ($status) { 'Stable' {'Low'} 'Degraded' {'Medium'} 'Unstable' {'High'} }
  $dl = $dlBase + (Get-Random -Maximum 5)
  $ul = $ulBase + (Get-Random -Maximum 3)
  $line = "${i},${sig},${lat},${loss},${jitter},${dl},${ul},${type},${load},${status},${risk}"
  $lines += $line
}
$lines -join "`n" | Set-Content -Path 'data\network_data.csv' -Encoding UTF8

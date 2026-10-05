// Fetch the Platera photoshoot (two Drive folders) into assets/shoot/<model>/.
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const FOLDERS = {
  merreeda: '1f_3mXiV2wVYRFisi2axpI7a9M87tUR4i 1Ba9FwzhfSFoDauk995H56sF1gKxD2aqZ 1Jb6y0ZqhuApqgS1M-rMZ19dzSSwewD1I 1i7K2lx_tx145ueXTS6Wzqisj6xr5s1XL 1qdgH7qaEHGYgQV1yO2Ap0VRwaoBmxaQN 1wECu_dN_w7EwoSOIg3QChTUzX6mDLCPv 1NFtN3_MXxG8DPFvkQ7cW_H6v79_SrQhB 1ipJSttjWdWxJc38O45Ibnio-G5S2U8_G 1tnB1ioNBQFry6GKvQVEpqMqMrPIwm-kN 1PijcU7zJoP_SKQQmWiFz6bozZ0IX8yfl 1vTI22hjkLHKlbKeH5AG7202W0y3P9tiF 1SQGlyWywhZMcRDAksk4qW-5bIi63v2DZ 19hb7xj9ItkR2mm7dRAC6LJZB5mkrA8nH',
  aarya: '1tKN9F8-_BP3Sr6zLLP9qfuca6w3rJ6cF 19O_04wFZAn_5LdZiyKaQUphpMJVgUF8D 19W1TYOr7Ia-bjpwSGWOUiHUInP5prmdu 1l0qvcVfqWM5zo6QZxlf1LHztAVhphbB3 1ZQ0zU6fNSYe60C_JQURAppqcWZhPEerm 1sgAol9EwFyy75U2NKCwGnZCGyxfgIntu 1um1emvtWT8PEv924rGtFLuUUCyv3hhjb 17GJHWO6jMB9CUdbb0PVwlLx7shMwn5dq 1h_Whx0R22YsAbu9W7zkmRBgDqjm3s8dN 12QSMNjcDNIkMhw2-J1ZAa7qSUCfBI0r7 16GkA_cJWhHzsj2VfvFbaCrIhI4dY6gGR 1MmDOM1vfiz1j4O0ZSrg8YfdZDkDqv1Ff 1r21MKmACMYCknvDiJ4gIPRsBG4jc6J50 1IpvMb0S2x-zTyMOui3IUijbtEj5Vjjqg 1t-mJtG2Iq38BxYqgpm9i1uDzxZpfLN-H 1OHKyxplaSUqf9-vqc3tO0vodECPDbYg6 1o9_Qs8gNh4j5hEXUZBk2fQQC56ernGG5 1oMBzCdcsuCMyQwu-6cbsy5p1Op8Mbjpo 1jckfowO-UdDT_Z9CPZDocRx_Z30oJ68C 1uespx-BVPLREYC2oM2yDZ8P12TVrR3iz 1SCOe6TlhQTP_YkAluK0p_U9eUkGDhrmP 1WSqpYa8fYocS_Hikwl6AJuq5l0vA735l 1RDLifjRpO4iQv_d_VGBM8_Dh-PuUeIWw 1y-N0Jwtep2vRAglf80ormjNsOpDRE0m0',
}

for (const [model, ids] of Object.entries(FOLDERS)) {
  const dir = join('assets/shoot', model)
  await mkdir(dir, { recursive: true })
  await Promise.all(
    ids.split(' ').map(async (id) => {
      const r = await fetch(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`)
      const cd = r.headers.get('content-disposition') ?? ''
      const name = /filename="([^"]+)"/.exec(cd)?.[1] ?? `${id}.jpg`
      const buf = Buffer.from(await r.arrayBuffer())
      await writeFile(join(dir, name), buf)
      console.log(model, name, r.headers.get('content-type'), buf.length)
    }),
  )
}

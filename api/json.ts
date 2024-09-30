import { Request, Response } from 'express'
import { retry } from '../retry'
import { service, FORMAT_CONTENT_TYPE } from '../service/edge'

function createSSML(text, voiceName) {
  text = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\'', '&apos;').replaceAll('"', '&quot;');
  return '\
        <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">\
          <voice name="'+ voiceName + '">\
              <prosody rate="0%" pitch="0%">\
                  '+ text + '\
              </prosody >\
          </voice >\
        </speak > '
}

// {
//
//   "voice": "zh-CN-YunxiaNeural",
//     "content": "如果喜欢这个项目的话请点个 Star 吧。",
//     "format": "audio-24khz-48kbitrate-mono-mp3"
// }

module.exports = async (request: Request, response: Response) => {

  let token = process.env.TOKEN
  if (token) {
    let authorization = request.headers['authorization']
    if (authorization != `Bearer ${token}`) {
      console.error('无效的TOKEN')
      response.status(401).json('无效的TOKEN')
      return
    }
  }

  let json = {
    voice: '',
    content: '',
    format: ''
  }
  try {
    json = JSON.parse(request.body)
  } catch {
    throw `参数错误：${request.body}`
  }

  try {
    if (Array.isArray(json.format)) {
      throw `无效的音频格式：${json.format}`
    }
    if (!FORMAT_CONTENT_TYPE.has(json.format)) {
      throw `无效的音频格式：${json.format}`
    }

    const ssml = createSSML(json.content, json.voice)

    let result = await retry(
        async () => {
          let result = await service.convert(ssml, json.format as string)
          return result
        },
        3,
        (index, error) => {
          console.warn(`第${index}次转换失败：${error}`)
        },
        '服务器多次尝试后转换失败',
    )
    console.log(result)
    response.sendDate = true
    response
        .status(200)
        .setHeader('Content-Type', FORMAT_CONTENT_TYPE.get(json.format))
    response.end(result)
  } catch (error) {
    console.error(`发生错误, ${error.message}`)
    response.status(503).json(error)
  }
}

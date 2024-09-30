import { Request, Response } from 'express'
const ra = require('./ra')

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
  return ra({
    body: createSSML(json.content, json.voice),
    headers: {
      authorization: request.headers['authorization'],
      format: json.format,
    }
  }, response)
}

/*!
 *  rubygana
 *
 *  MIT License
 *  ©  2018 ころん:すとりーむ
 */

'use strict'

// index0-5が小1-6、6が残り常用漢字
const 学年別漢字 = require('./学年別漢字.js')

module.exports = (html, オプション, コールバック) => {
  if (typeof html !== 'string') {
    throw __filename + ': stringでない入力'
  }
  html = html.trim()

  if (オプション.debug) {
    console.time('#### 解析時間')
    console.log()
  }

  const cheerio = require('cheerio')
  const loadOption = {
    decodeEntities: false,
  }

  // ロードでhtml,head,bodyはどれか無くても自動生成。DOCTYPEは生成されず
  // 元からの有無は('body').get().lengthなどでは判定できず
  let $ = cheerio.load(html, loadOption)
  セレクタ文法チェック($)

  // 空文字で対象なし(notで全対象)
  // cheerio: title下にタグがあっても$('title').find('タグ')は無効
  $(オプション.selector).not(オプション.not_selector).find('rb').each((i, element) => {
    const rb = $(element).text()
    let 学年クラス = ''
    rb.split('').forEach((漢字) => {
      const 常用 = 学年別漢字.find((item, index) => {
        if (item.includes(漢字)) {
          学年クラス += オプション.add_class + (index + 1) + ' '
          return true
        }
      })
      if (常用 === undefined) {
        学年クラス += オプション.add_class + '8 '
      }
    });
    // class="学年4 学年2 学年4"のように重複するが、文字ごとの学年希望
    $(element).parent('ruby').addClass(学年クラス)
  })

  // --css
  if (オプション.css !== null) { // 空文字あり
    $('head').append('<style>' + オプション.css + '</style>\n')
  }

  if (オプション.debug) {
    console.timeEnd('#### 解析時間')
    console.log()
  }

  // load()やhtml()で<pre><code>内の&lt;なども<に変換、元に戻す
  // text()だとその中を検索できず
  $('body').find('code').each((i, element) => {
    $(element).text($(element).html().replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  })

  // --switch
  if (オプション.switch) {
    const switch_html = ファイル読込(__dirname + '/switch.html')
    if (オプション.add_class === '学年') {
      $('body').prepend(switch_html)
    } else {
      $('body').prepend(switch_html.replace(/ruby\.学年/g, 'ruby.' + オプション.add_class))
    }
    const rt非表示style = '  <style>ruby>rt.rt非表示{display:none;}</style>\n'
    $('head').append(rt非表示style)
  }

  let 結果
  if (オプション.only_body) {
    結果 = $('body').html()
  } else {
    結果 = $.html()
  }
  if (結果.startsWith('<html')) {
    結果 = '<!DOCTYPE html>' + 結果
  }

  if (オプション.末尾改行) {
    コールバック(結果 + '\n')
  } else {
    コールバック(結果)
  }

  function セレクタ文法チェック($) {
    try {
      if (オプション.selector) {
        $(オプション.selector)
      }
    } catch (e) {
      console.error('エラー: add-class.js: --selector の文法')
      console.error(e)
      process.exit(3)
    }
    try {
      if (オプション.not_selector) {
        $(オプション.not_selector)
      }
    } catch (e) {
      console.error('エラー: add-class.js: --not-selector の文法')
      console.error(e)
      process.exit(3) // TODO
    }
  }
}

function ファイル読込(ファイル) {
  const fs = require('fs')
  try {
    return fs.readFileSync(ファイル, 'utf8')
  } catch (e) {
    console.error('ファイルを開けない: ' + ファイル)
    console.error(e)
    process.exit(2)
  }
}

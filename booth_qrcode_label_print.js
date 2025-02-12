// ==UserScript==
// @name         BoothQRコード印刷
// @version      2024-12-01
// @description  Boothの注文画面から50x30のラベルを印刷するスクリプト
// @author       Nobuki Inoue
// @match        https://manage.booth.pm/orders/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addStyle() {
        // IDを指定して既存のスタイルタグをチェック
        const styleId = 'label-print-style';
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            styleElement.textContent = `

            #label-print-content {
                display: none;
            }
            @media print
            {
                /* すべての要素を非表示 */
                body * {
                    display: none;
                }

                /* ページ全体の設定 */
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                /* 印刷対象のコンテンツ */
                #label-print-content {
                    width: 50mm;
                    height: 30mm;
                    box-sizing: border-box;
                    border: 0px solid;
                    display: flex;
                    flex-direction: row;            /* 横並びに変更 */
                    align-items: center;
                    font-size: 9px;
                }

                #label-print-content * {
                    display: block;
                }

                /* QRコードの設定 */
                #label-print-content img {
                    width: 25mm;
                    height: 25mm;
                }
                #label-print-content.barcode img {
                    width: 50mm;
                    height: 29mm;
                }

                /* 商品詳細の設定 */
                #label-print-content div span{
                    font-size: 9px;
                    margin: 1mm 0;
                    width: 23mm;
                    text-align: left;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #label-print-content.barcode{
                    margin: -2mm;
                }
                #label-print-content.barcode div span{
                    margin: -1px;
                    width: 45mm;
                }
                #label-print-content.barcode .right{
                    position: absolute;
                    top:17mm;
                    left:1mm;
                    background-color: white;
                    max-width: 45mm;
                    display: flex;
                    flex-wrap: wrap;
                }
                #label-print-content.barcode .right > span {
                    flex: 1 1 100%;
                }
                #label-print-content.barcode .right > .quantity {
                    flex: 1 1 calc(50% - 10px); /* 2列表示（gap分引く） */
                }
            /*}*/
        `;
            document.head.appendChild(styleElement);
        }
    }

    const domId = 'label-print-content';
    const oldDom = document.getElementById(domId);
    if(oldDom) { oldDom.remove(); }

    // 印刷ラベル用のDOM
    const labelElement = document.createElement('div');
    labelElement.id = domId;
    document.body.appendChild(labelElement)

    const left = document.createElement('div');
    const right = document.createElement('div');
    right.classList.add('right');
    labelElement.appendChild(left)
    labelElement.appendChild(right)

    // QRコードを複製
    const qrElement = document.querySelector('img[src^="https://s2.booth.pm/yamato_invoices/"]')
    left.appendChild(qrElement.cloneNode(true));

    const barcode = qrElement.classList.contains('w-full')
    if(barcode) {
        labelElement.classList.add('barcode');
    }

    // 注文番号
    const orderNumberMatch = window.location.href.match(/\/orders\/(\d+)/);
    const orderElement = document.createElement('span');
    orderElement.textContent = orderNumberMatch[1];
    right.appendChild(orderElement);

    // 商品情報を複製
    const mapping = {
        // "長ーーーーい商品名", "印刷用の商品名",
        "PREDUCTS 木製ヘッドフォンハンガー": "木製ヘッドフォンハンガー",
        "Keyball 25mmトラックボール ベアリングケース": "トラックボール ベアリングケース",
    }
    let lastTitle = ''
    document.querySelectorAll('img[src*="https://booth.pximg.net/"]').forEach(img => {
        const parent = img.parentNode;
        let title = parent.querySelector('a').textContent.trim();
        title = mapping[title]?.name || title;
        const color = parent.querySelector('.typography-12.text-text-gray500:nth-of-type(3)')?.textContent.trim() || '';
        const quantity = parent.querySelector('.flex.flex-row > div.flex-none.text-right.typography-16.font-bold').textContent.replace('点', '').trim();

        if(lastTitle != title) {
            const titleElement = document.createElement('span');
            titleElement.textContent = title;
            right.appendChild(titleElement);

        }
        lastTitle = title

        const detailElement = document.createElement('span');
        detailElement.classList.add('quantity')
        detailElement.textContent = [color,quantity].filter(str=>str.length > 0).join(' : ')
        right.appendChild(detailElement);
    });

    addStyle();
})();

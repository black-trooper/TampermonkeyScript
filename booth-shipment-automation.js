// ==UserScript==
// @name         Booth注文詳細自動設定
// @namespace    http://tampermonkey.net/
// @version      2025-06-16
// @description  Boothの注文詳細を自動的に設定する
// @author       Nobuki Inoue
// @match        https://manage.booth.pm/orders?state=paid
// @match        https://manage.booth.pm/orders?page=2&state=paid
// @match        https://manage.booth.pm/orders/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // href属性が "/orders/" で始まり、テキストが "二次元コードを発行する" である最初の <a> 要素を取得
    const link = Array.from(document.querySelectorAll('a[href^="/orders/"].btn.small.full-length'))
                      .find(a => a.textContent.trim() === "発送コードを発行する");

    // 最初のリンクが存在すればフォーカスを設定
    if (link) {
        link.focus();
    }

    var title
    document.querySelectorAll('img[src*="https://booth.pximg.net/"]').forEach(img => {
        const parent = img.parentNode;
        title = parent.querySelector('a')?.textContent.trim();
    });
    if(!title){
        return
    }


    const SELECT_NAME = 'yamato_invoice_form[code_type]';

    function saveValue(value) {
        GM_setValue('last_code_type', value);
    }

    async function loadValue() {
        return await GM_getValue('last_code_type', '');
    }

    function setSelectValue(select, value) {
        if (!value) return;
        const option = Array.from(select.options).find(o => o.value === value);
        if (option) {
            select.value = value;
            // イベント発火が必要な場合は以下も追加
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function waitForSelect(selector, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const interval = 100;
            let elapsed = 0;

            const check = () => {
                const element = document.querySelector(`select[name="${selector}"]`);
                if (element) {
                    resolve(element);
                } else if ((elapsed += interval) >= timeout) {
                    reject('Timeout waiting for select element');
                } else {
                    setTimeout(check, interval);
                }
            };

            check();
        });
    }

    // 最後に選んだ発送するコンビニ・営業所を保存する
    (async function () {
        try {
            const select = await waitForSelect(SELECT_NAME);
            const lastValue = await loadValue();
            setSelectValue(select, lastValue);

            select.addEventListener('change', () => {
                saveValue(select.value);
            });
        } catch (e) {
            console.warn(e);
        }
    })();

    // 商品ごとのマッピング
    // name: 発送伝票に印刷する17文字以内の品名。未指定の場合は商品名が印刷されます
    // checkbox: 荷扱いとしてチェックするもの
    const mapping = {
        "PREDUCTS 木製ヘッドフォンハンガー": {
            "name": "木製ヘッドフォンハンガー",
            "checkbox": [
                'do_not_stack', // 下積厳禁
            ],
        },
        "Keyball 25mmトラックボール ベアリングケース": {
            "name": "トラックボール ベアリングケース",
            "checkbox": [
                'precision_equipment', // 精密機器
                'do_not_stack', // 下積厳禁
            ],
        },
        "COROPIT": {
            "checkbox": [
                'precision_equipment', // 精密機器
                'do_not_stack', // 下積厳禁
            ],
        },
    }

    // 荷扱い（２つまで）　チェックしないものをコメントアウトしてください
    // mappingで設定されていない場合はここの設定値が反映されます
    const checkboxValues = mapping[title]?.checkbox || [
        'precision_equipment', // 精密機器
        // 'fragile', // ワレモノ
        'do_not_stack', // 下積厳禁
        // 'do_not_turn_over', // 天地無用
        // 'raw_food' // ナマモノ
    ];

    // id="yamato_invoice_form_description" の要素を取得
    var element = document.getElementById("yamato_invoice_form_description");
    if (element) {
        // "書籍" を置き換え
        const newProductName = mapping[title]?.name || title;
        element.value = newProductName.length > 8 ? //
            newProductName : element.value.replace('書籍', newProductName);

        // チェックボックスをチェック
        if(checkboxValues){
            checkboxValues.forEach(value => {
                var checkbox = document.querySelector(`input[type="checkbox"][value="${value}"]`);
                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                }
            });
        }

        // 発送コードを発行するボタンにフォーカス
        const submitButton = document.querySelector('input[name="commit"][value="発送コードを発行する"]');
        if (submitButton) {
            submitButton.focus();
        }
    }
})();

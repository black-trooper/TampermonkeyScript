// ==UserScript==
// @name         Booth注文詳細自動設定
// @namespace    http://tampermonkey.net/
// @version      2024-10-04
// @description  Boothの注文詳細を自動的に設定する
// @author       Nobuki Inoue
// @match        https://manage.booth.pm/orders?state=paid
// @match        https://manage.booth.pm/orders?page=2&state=paid
// @match        https://manage.booth.pm/orders/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 変更後の商品名　デフォルトで設定されている「書籍」が置き換えられます
    const newProductName = '3Dプリント製品';

    // 荷扱い（２つまで）　チェックしないものをコメントアウトしてください
    const checkboxValues = [
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
        element.value = element.value.replace('書籍', newProductName);

        // チェックボックスをチェック
        checkboxValues.forEach(value => {
            var checkbox = document.querySelector(`input[type="checkbox"][value="${value}"]`);
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
            }
        });

        // 発送コードを発行するボタンにフォーカス
        const submitButton = document.querySelector('input[name="commit"][value="発送コードを発行する"]');
        if (submitButton) {
            submitButton.focus();
        }
    }

    // href属性が "/orders/" で始まり、テキストが "二次元コードを発行する" である最初の <a> 要素を取得
    const link = Array.from(document.querySelectorAll('a[href^="/orders/"].btn.small.full-length'))
                      .find(a => a.textContent.trim() === "発送コードを発行する");

    // 最初のリンクが存在すればフォーカスを設定
    if (link) {
        link.focus();
    }
})();

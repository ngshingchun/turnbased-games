// 作者：怒怒 https://space.bilibili.com/141211391
// 补充和修改：时舟（sizau） https://space.bilibili.com/3546754953775813
"use strict";

console.log("%c BwikiTune %c https://wiki.biligame.com/tools/BwikiTune", "color: #fff; padding: 5px 0; background: #aaa;", "padding: 5px 5px 5px 0; background: #fff;");

var GameName = RLCONF.wgGameName;

(function () {
    document.querySelectorAll('.mobile-mask, #navBar, #tocBtn').forEach(el => {
        el.remove();
    });
    var gameBg = document.querySelector('.game-bg');
    var mwBodyHeader = `<div class="mw-body-header"><div class="mw-mask"></div><button id="toc-button" class="toc-button"></button></div>`;
    gameBg.insertAdjacentHTML('afterbegin', mwBodyHeader);
}());

function NavMenuHandler() {
    var mobileNavMenu = document.querySelector('.mobile-nav-menu');
    if (!mobileNavMenu) {
        return;
    }
    var ulMenu1 = mobileNavMenu.querySelector('.ul-menu-1');
    var clonedNavMenu = ulMenu1.cloneNode(true);
    mobileNavMenu.remove();
    clonedNavMenu.classList.replace('ul-menu-1', 'mw-ul-menu-1');
    clonedNavMenu.querySelectorAll('*').forEach(el => {
        el.classList.forEach(cls => {
            if (/^(ul-menu-1|li-menu-1|ul-menu-2|li-menu-2|ul-menu-3|li-menu-3|menu-title|menu-title-1)$/.test(cls)) {
                el.classList.replace(cls, 'mw-' + cls);
                el.classList.remove('clearfix');
            }
        });
    });
    clonedNavMenu.querySelectorAll('i.mobile-right, i.mobile-down, .caret').forEach(el => {
        el.remove();
    });
    var mwNavMenuHtml = `<div id="mw-nav-menu" class="mw-nav-menu"><div class="mw-menutop"><div class="nav-close"></div><div class="nav-logo"><img src="https://patchwiki.biligame.com/resources/assets/images/logo/logo_${GameName}.png"></div></div>${clonedNavMenu.outerHTML}<div class="bwiki-sns-wrap"><a href="https://wiki.biligame.com/wiki/%E9%A6%96%E9%A1%B5" class="bwiki-sns-item">BWIKI首页</a><a href="https://wiki.biligame.com/wiki/WIKI%E7%94%B3%E8%AF%B7%E9%A1%B5%E9%9D%A2" class="bwiki-sns-item">创建WIKI</a><a href="https://space.bilibili.com/477233102?spm_id_from=333.337.0.0" class="bwiki-sns-item">BWIKI客服</a><a href="https://space.bilibili.com/477233102" class="bwiki-sns-item">BWIKI君</a></div></div>`;
    document.body.insertAdjacentHTML('beforeend', mwNavMenuHtml);
    var mwNavMenu = document.querySelector('.mw-nav-menu');
    var mwMask = document.querySelector('.mw-mask');
    function updateMenu(li) {
        mwNavMenu.querySelectorAll('li, ul').forEach(el => {
            if (li !== el) {
                el.classList.remove('active');
                el.style.display = '';
            }
        });
    }
    function closeNav() {
        mwNavMenu.classList.remove('opennav');
        updateMenu();
        mwMask.style.display = 'none';
        //var wikiComment = document.querySelector('.h5-wiki-comment');
        //if (wikiComment) { wikiComment.style.display = ''; }
        document.body.classList.remove('overflowhidden');
    }
    NavMenuHandler.closeNav = closeNav;
    function openNav() {
        mwNavMenu.classList.add('opennav');
        //var wikiComment = document.querySelector('.h5-wiki-comment');
        //if (wikiComment) { wikiComment.style.display = 'none'; }
        mwMask.style.display = 'block';
        document.body.classList.add('overflowhidden');
    }
    mwNavMenu.querySelectorAll('.mw-li-menu-1').forEach(el => {
        var ulMenu2 = el.querySelector('.mw-ul-menu-2');
        if (ulMenu2) {
            var i = document.createElement("i");
            el.prepend(i);
            el.addEventListener('click', function (event) {
                event.stopPropagation();
                if (event.target.closest('.mw-ul-menu-2')) {
                    return;
                }
                updateMenu(el);
                el.classList.toggle('active');
                /*var ulMenu2 = el.querySelector('.mw-ul-menu-2');
                if (ulMenu2) {
                    updateMenu(el);
                    if (el.classList.contains('active')) {
                        el.classList.remove('active');
                        ulMenu2.style.display = 'none';
                    } else {
                        el.classList.add('active');
                        ulMenu2.style.display = 'block';
                    }
                } else {
                    var link = el.querySelector('a');
                    if (link && link.href.indexOf('javascript') !== -1) {
                        updateMenu(el);
                        el.classList.toggle('active');
                    } else if (link) {
                        window.location.href = link.href;
                    }
                }*/
            });
        }
    });
    mwNavMenu.querySelectorAll('.mw-li-menu-2').forEach(el => {
        var ulMenu3 = el.querySelector('.mw-ul-menu-3');
        if (ulMenu3) {
            var i = document.createElement("i");
            el.prepend(i);
            el.addEventListener('click', function (event) {
                event.stopPropagation();
                if (event.target.closest('.mw-ul-menu-3')) {
                    return;
                }
                slideToggle(ulMenu3, 300);
                el.classList.toggle('active');
            });
        }
    });
    var navHead = document.querySelector('.nav-head');
    navHead.insertAdjacentHTML('beforeend', '<button id="nav-button" class="nav-button hidden-sm hidden-md hidden-lg"></button>');
    var navButton = document.getElementById('nav-button');
    navButton.addEventListener('click', function (event) {
        event.stopPropagation();
        if (mwNavMenu.classList.contains('opennav')) {
            closeNav();
        } else {
            openNav();
        }
    });
    mwMask.addEventListener('click', closeNav);
    var navClose = mwNavMenu.querySelector(".nav-close");
    navClose.addEventListener('click', closeNav);
    /*document.addEventListener('click', function (event) {
        if (event.target.closest('#mw-toc')) {
            return;
        }
        if (!mwNavMenu.contains(event.target)) {
            closeNav();
        }
        if (!event.target.closest('.mw-nav-menu')) {
            closeNav();
        }
    });*/
}
NavMenuHandler();

function TocHandler() {
    var toc = document.getElementById("toc");
    if (!toc) {
        return;
    }
    var clonedToc = document.querySelector("#toc>ul").cloneNode(true);
    clonedToc.querySelectorAll('i').forEach(el => {
        el.remove();
    });
    //toc.remove();
    var tocHtml = `<div id="mw-toc" class="mw-toc"><div class="mw-toctitle" lang="zh-Hans-CN" dir="ltr"><i class="toc-close"></i><h2 id="mw-toc-heading">目录</h2></div>${clonedToc.outerHTML}</div>`;
    document.body.insertAdjacentHTML('beforeend', tocHtml);
    var mwtoc = document.getElementById('mw-toc');
    var mwMask = document.querySelector('.mw-mask');
    function closeToc() {
        mwtoc.classList.remove('opentoc');
        mwMask.style.display = 'none';
        //var wikiComment = document.querySelector('.h5-wiki-comment');
        //if (wikiComment) { wikiComment.style.display = ''; }
        document.body.classList.remove('overflowhidden');
    }
    function openToc() {
        NavMenuHandler.closeNav();
        mwtoc.classList.add('opentoc');
        mwMask.style.display = 'block';
        //var wikiComment = document.querySelector('.h5-wiki-comment');
        //if (wikiComment) { wikiComment.style.display = 'none'; }
        document.body.classList.add('overflowhidden');
    }
    mwtoc.querySelectorAll("li").forEach(li => {
        var ul = li.querySelector('ul');
        if (ul) {
            var i = document.createElement("i");
            li.prepend(i);
            i.addEventListener("click", function (event) {
                event.stopPropagation();
                //var i = li.querySelector("i");
                i.classList.toggle('active');
                slideToggle(ul, 300);
            });
        }
    });
    // 初始展开全部子标题
    /*mwtoc.querySelectorAll("li>i").forEach(i => {
        i.click();
    });*/
    var tocButton = document.getElementById('toc-button');
    tocButton.style.display = "inline-block";
    tocButton.addEventListener("click", function (event) {
        event.stopPropagation();
        if (mwtoc.classList.contains('opentoc')) {
            closeToc();
        } else {
            openToc();
        }
    });
    mwMask.addEventListener("click", closeToc);
    var tocClose = document.querySelector('.toc-close');
    tocClose.addEventListener("click", closeToc);
    mwtoc.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", closeToc);
    });
}
TocHandler();

function slideToggle(element, duration = 300) {
    if (!element) return;
    const isHidden = window.getComputedStyle(element).display === 'none';
    if (isHidden) {
        element.style.display = 'block';
        const height = element.scrollHeight;
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        requestAnimationFrame(() => {
            element.style.height = `${height}px`;
        });
        setTimeout(() => {
            element.style.height = '';
            element.style.overflow = '';
            element.style.transition = '';
        }, duration);
    } else {
        const height = element.scrollHeight;
        element.style.height = `${height}px`;
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        requestAnimationFrame(() => {
            element.style.height = '0';
        });
        setTimeout(() => {
            element.style.display = 'none';
            element.style.height = '';
            element.style.overflow = '';
            element.style.transition = '';
        }, duration);
    }
}
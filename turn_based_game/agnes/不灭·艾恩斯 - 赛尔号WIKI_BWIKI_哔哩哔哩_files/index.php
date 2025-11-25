/* 样式参考 粉彩画_pastel https://wiki.biligame.com/blhx/?curid=256 */
@media screen and (min-width: 768px) {
	.mw-parser-output:not(:has(#noscrolltoc)) #toc {display: none;}
	.scrolltoc.toc .toctogglecheckbox:checked ~ ul {display: block;}
	.scrolltoc.toc {position: fixed;top: 90px;width: 250px;display:block;left: 5px;z-index: 990;padding: 0;padding-left: 5px;padding-top: 36px;padding-bottom: 5px;transition: all 0.5s;background-color: #f8f9fa;border-radius: 5px;border: none;box-shadow: 0px 0px 5px 0px #a9a9a9;}
	.scrolltoc.toc .toctitle {position: absolute;top: 0;left: 0;width: inherit;height: 36px;background-color: transparent;z-index: 999;border-radius: 5px 5px 0 0;font-size: 16px;font-weight: bold;cursor: pointer;}
	.scrolltoc.toc .toctitle h2{line-height: 36px!important;}
	.scrolltoc.toc .toctogglespan,.scrolltoc.toc input {display:none!important;}
	.scrolltoc.toc>ul::-webkit-scrollbar {width: 10px;}
	.scrolltoc.toc>ul::-webkit-scrollbar-thumb {background:#ccc;border-radius:5px;}
	.scrolltoc.toc>ul {display: block;position:relative;min-height: 100px;max-height: 50vh;margin: 0;padding: 0;padding-right: 5px;z-index: 991;overflow-y: auto;overflow-x: hidden;}
	.scrolltoc.toc ul ul {margin: 0 0 0 1em;}
	.scrolltoc.toc li {margin-bottom:0;}
	.scrolltoc.toc li a {display: inline-flex;color: #000;padding: 5px;padding-right: 3px;line-height: 1.3;position: relative;white-space: nowrap;width: 100%;}
	.scrolltoc.toc li a:hover, .scrolltoc.toc li a:hover * {color: #00b6ff;}
	.scrolltoc.toc li a:not(.titleActive):hover::after {background-color: #ddd;}
	.scrolltoc.toc li a>* {background-color: transparent!important;position: relative;z-index: 993;}
	.scrolltoc.toc li a .toctext {overflow: hidden;text-overflow: ellipsis;}
	.scrolltoc.toc .titleActive {color: #000!important;font-weight:bold!important;background-color: transparent!important;}
	.scrolltoc.toc .titleActive::after,.scrolltoc.toc a:hover::after {content:"";position:absolute;right: 0;top: 0;width: 100%;cursor:pointer;height: 100%;background-color: #D1DBF3;border-radius: 5px;z-index: 992;}
	.scrolltoc.toc .toclevel-2 .titleActive::after,.scrolltoc.toc .toclevel-2 a:hover::after {width: calc(100% + 1em);}
	.scrolltoc.toc .toclevel-3 .titleActive::after,.scrolltoc.toc .toclevel-3 a:hover::after {width: calc(100% + 2em);}
	.scrolltoc.toc .toclevel-4 .titleActive::after,.scrolltoc.toc .toclevel-4 a:hover::after {width: calc(100% + 3em);}
	.scrolltoc.toc .toclevel-5 .titleActive::after,.scrolltoc.toc .toclevel-5 a:hover::after {width: calc(100% + 4em);}
	.scrolltoc.toc .toclevel-6 .titleActive::after,.scrolltoc.toc .toclevel-6 a:hover::after {width: calc(100% + 5em);}
	.scrolltoc.hidetoc.toc {box-shadow: 0px 0px 0px 0px transparent;transform: translateX(calc(-100% - 5px));}
	.scrolltoc.toc::after {content:"隐藏目录<";position: absolute;background-color:#efefff;font-weight:bold;top: 36px;right: 0;font-size: 14px;line-height: 1.25;width: 25px;padding: 5px 5px;border:1px solid #a2a9b1;border-left:0;cursor: pointer;transition: all 0.5s;border-radius: 0 5px 5px 0;z-index: 991;transform: translateX(calc(100% - 1px));}
	.scrolltoc.hidetoc.toc::after {content:"显示目录>";}
	.toc-sticky .toc .titleActive {color: #000!important;font-weight:bold!important;background-color: transparent!important;}
	.stickylefttoc.scrolltoc.toc {/* transform: translateX(-5px); */}
	.stickylefttoc.scrolltoc.toc>ul { max-height: calc(100vh - 90px - 36px - 5px - 200px - 170px);}
	.stickylefttoc.scrolltoc.toc::after {content: "隐藏目录>";right: unset;left: 0;/* top: unset; *//* bottom: 35px; */transform: translateX(calc(-100% + 1px));border: 1px solid #a2a9b1;border-right: 0;border-radius: 5px 0 0 5px;}
	.stickylefttoc.scrolltoc.hidetoc.toc {transform: translateX(calc(250px + 5px));width: 0;visibility: hidden;}
	.stickylefttoc.scrolltoc.hidetoc.toc .toctitle{visibility: hidden;}
	.stickylefttoc.scrolltoc.hidetoc.toc::after {content: "显示目录<";visibility: visible;}
}
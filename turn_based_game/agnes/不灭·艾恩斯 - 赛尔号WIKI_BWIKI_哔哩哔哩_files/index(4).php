.mobile-mask,
#navBar,
#tocBtn {
    display: none !important;
}

.mw-mask {
    display: none;
    position: fixed;
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    background: rgba(0, 0, 0, .5);
    z-index: 1000;
}

@media (min-width: 768px) {
    .mw-mask {
        display: none !important;
    }
}

.overflowhidden {
    overflow: hidden;
}

@media (min-width: 768px) {
    .overflowhidden {
        overflow: inherit;
    }
}

/* menu */
.nav-button {
    display: inline-block;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 4px;
    transition: all 0.5s;
    background-color: transparent;
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAkElEQVR4nO3awQ2AIBQFQbT/nrUA483IQmYKIOHv9Q0AAAAAAOBrx8t7l0v/4nH/c89/rkuQGEFiBIkRJEaQGEFiBIkRBAAAAAAAAABYgvX7XNbvdYLECBIjSIwgMYLECBIjSIwgAAAAAAAAAMASrN/nsn6vEyRGkBhBYgSJESRGkBhBYgQBAAAAAAC2Nsa4AV1ZAzp03VcoAAAAAElFTkSuQmCC");
    background-size: 70% 75%;
    background-position: 50%;
    background-repeat: no-repeat;
}

.nav-button {
    float: left;
    margin-right: 20px;
    top: 50%;
    transform: translateY(-50%);
    position: relative;
}

.nav-button:hover {
    background-color: #ddd;
}

.mw-nav-menu {
    width: 200px;
    max-width: 45%;
    height: 100%;
    position: fixed;
    left: -100%;
    top: 0;
    font-size: 14px;
    padding-top: 1px;
    border-right: 1px solid #ccc;
    background-color: #fff;
    z-index: 9999;
    transition: all 0.5s;
}

.mw-nav-menu.opennav {
    left: 0;
}

.mw-nav-menu .mw-menutop {
    margin-top: 30px;
    height: 70px;
    padding-left: 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.mw-nav-menu .nav-close {
    cursor: pointer;
    display: inline-block;
    width: 30px;
    height: 30px;
    background-image: url(data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI0NDRDBENyIgZD0iTTg3Ny4zOTcgNTMzLjYzMmE0Mi42NjcgNDIuNjY3IDAgMDEtNDIuNjY2IDQyLjY2N0gzMTYuNjcybDIyOC4yMjQgMjI4LjI2NmE0Mi42NjcgNDIuNjY3IDAgMDEtNjAuMzMgNjAuMzMxTDE4Mi44NjggNTYzLjJhNDIuNjY3IDQyLjY2NyAwIDAxMC02MC4zM2wzMDEuNjU0LTMwMS43NGE0Mi42NjcgNDIuNjY3IDAgMDE2MC4zNzMgNjAuMzc0TDMxNS4zNDkgNDkwLjk2NWg1MTkuMzgyYTQyLjY2NyA0Mi42NjcgMCAwMTQyLjY2NiA0Mi42Njd6Ii8+PC9zdmc+);
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: 20px;
}

.mw-nav-menu .nav-logo {
    display: flex;
    width: 150px;
    max-width: calc(100% - 15px);
    height: 40px;
    margin-left: 7px;
    align-items: center;
    justify-content: center;
}

.mw-nav-menu .nav-logo img {
    max-width: 100%;
    height: auto;
}

.mw-nav-menu ul,
.mw-nav-menu li {
    list-style: none;
}

.mw-nav-menu ul>li {
    min-height: 45px;
    line-height: 30px;
    margin: 0;
}

.mw-nav-menu a {
    display: inline-flex;
    align-items: center;
    width: 100%;
    height: 45px;
    /* margin-top: 5px; */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
    color: #000;
}

.mw-nav-menu .mw-ul-menu-1 {
    padding-bottom: 75px;
}

.mw-nav-menu .mw-li-menu-1 {
    margin-top: 5px;
    /* padding-top: 1px; */
    /* padding-left: 15px; */
}

.mw-nav-menu .mw-li-menu-1.active {
    background-color: #f2f4f6;
}

.mw-nav-menu .mw-li-menu-1>a {
    padding-left: 15px;
}

.mw-nav-menu .mw-li-menu-1>i {
    content: '';
    display: inline-block;
    position: absolute;
    right: 10px;
    width: 20px;
    height: 20px;
    margin-top: 10px;
    cursor: pointer;
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: 15px;
    background-image: url(data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI0NDRDBENyIgZD0iTTcyMy42OTYgNTMzLjEwM2MuNDg3LS45NzMgMS4zMzgtMS44MjUgMS43MDMtMi43OTggOC41MTQtMTcuNzU4IDUuNzE3LTM5LjY1MS05LjM2NS01My44ODJMMzcyLjMwOCAxNTEuMzA3Yy0xOC43My0xNy43NTgtNDguMjg3LTE2LjkwNi02Ni4wNDUgMS44MjUtMTcuNzU3IDE4LjczLTE2LjkwNiA0OC4yODcgMS44MjUgNjYuMDQ1bDMwOC40NTMgMjkxLjc5LTMwNy4yMzcgMjk2LjA0NmMtMTguNjEgMTcuODgtMTkuMDk2IDQ3LjQzNS0xLjIxNiA2Ni4wNDUgOS4xMjIgOS40ODcgMjEuNDA3IDE0LjM1MiAzMy41NyAxNC4zNTIgMTEuNjc2IDAgMjMuMzUzLTQuMzc5IDMyLjM1My0xMy4xMzZsMzQwLjU2My0zMjguMjc5Yy42MDgtLjYwOC44NTItMS41OCAxLjU4MS0yLjE4OS40ODctLjQ4Ni45NzMtLjg1MSAxLjU4Mi0xLjMzOCAyLjc5Ny0yLjc5NyA0LjEzNS02LjIwMyA1Ljk2LTkuMzY1em0wIDAiLz48L3N2Zz4=);
}

.mw-nav-menu .mw-ul-menu-2 {
    display: none;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    position: absolute;
    top: 0;
    left: -100%;
    opacity: 0;
    padding-top: 104px;
    background-color: #f2f4f6;
    transition: opacity 0.3s;
}

.mw-nav-menu .mw-li-menu-1.active .mw-ul-menu-2 {
    opacity: 1;
    left: calc(min(200px, 45vw) - 1px);
    display: block;
}

.mw-nav-menu .mw-li-menu-2>i {
    content: '';
    display: inline-block;
    position: absolute;
    right: 10px;
    width: 20px;
    height: 20px;
    margin-top: 10px;
    cursor: pointer;
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: 15px;
    background-image: url(data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI0NDRDBENyIgZD0iTTI4Ni4xNjUgMzUzLjgzNWwyNDEuMzY2IDI0MS4zMjIgMjQxLjM2NS0yNDEuMzIyYTQyLjY2NyA0Mi42NjcgMCAxMTYwLjMzIDYwLjMzbC0yNzEuNTMgMjcxLjUzMWE0Mi40NTMgNDIuNDUzIDAgMDEtMjIuNjEzIDExLjgxOWwtNS4wMzUuNTk3aC01LjAzNWE0Mi40OTYgNDIuNDk2IDAgMDEtMjcuNjQ4LTEyLjM3M2wtMjcxLjUzLTI3MS42MTZhNDIuNjY3IDQyLjY2NyAwIDAxNjAuMzMtNjAuMzMxeiIvPjwvc3ZnPg==);
}

.mw-nav-menu .mw-li-menu-2.active>i {
    background-image: url(data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI0NDRDBENyIgZD0iTTEzOS42MzYgNzMzLjA5YTM1LjE0MiAzNS4xNDIgMCAwMS0yNC42NjktMTAuMjQgMzQuNjc2IDM0LjY3NiAwIDAxMC00OS4zMzdsMzcyLjM2NC0zNzIuMzY0YTM0LjkxIDM0LjkxIDAgMDE0OS4zMzggNDkuMzM4TDE2NC4zMDUgNzIyLjg1MWEzNS4xNDIgMzUuMTQyIDAgMDEtMjQuNjY5IDEwLjI0em03NDQuNzI4IDBhMzUuMTQyIDM1LjE0MiAwIDAxLTI0LjY3LTEwLjI0TDQ4Ny4zMzIgMzUwLjQ4OGEzNC45MSAzNC45MSAwIDAxNDkuMzM4LTQ5LjMzOGwzNzIuMzY0IDM3Mi4zNjRhMzQuNjc2IDM0LjY3NiAwIDAxMCA0OS4zMzggMzUuMTQyIDM1LjE0MiAwIDAxLTI0LjY3IDEwLjI0eiIvPjwvc3ZnPg==);
}

.mw-nav-menu .mw-li-menu-2>a {
    padding-left: 15px;
}

.mw-nav-menu .mw-ul-menu-3 {
    display: none;
}

.mw-nav-menu .mw-li-menu-3>a {
    padding-left: 30px;
    color: #606162;
}

.bwiki-sns-wrap {
    padding: 0;
    display: inline-block;
    height: 75px;
    position: absolute;
    background-color: #fff;
    bottom: 0;
    border-top: 1px solid #ececec;
}

.bwiki-sns-wrap .bwiki-sns-item {
    justify-content: center;
    height: 17.5px;
    font-size: 12px;
    color: rgba(0, 0, 0, .85) !important;
    margin: 10px;
    width: calc(50% - 20px);
}

/* toc */
#toc {
    display: none;
}

@media (min-width: 768px) {
    #toc {
        display: inline-block;
    }
}

@media (max-width: 767px) {
    .wiki-header .nav-head {
        border-bottom: 1px solid rgba(0, 0, 0, .1);
        height: 75px !important;
        position: relative !important;
        line-height: 75px;
    }
}

.toc-button {
    display: none;
    bottom: 13%;
    right: 4%;
    width: 35px;
    height: 35px;
    border: none;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, .8);
    position: fixed;
    transition: all 0.5s;
    background-position: 50%;
    background-repeat: no-repeat;
    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCA2MCI+PHBhdGggZD0iTTU2LjUgNDhjMS45IDAgMy41IDEuNiAzLjUgMy41UzU4LjQgNTUgNTYuNSA1NWgtMzVjLTEuOSAwLTMuNS0xLjYtMy41LTMuNXMxLjYtMy41IDMuNS0zLjVoMzV6bS01MCAwYzEuOSAwIDMuNSAxLjYgMy41IDMuNVM4LjQgNTUgNi41IDU1aC0zQzEuNiA1NSAwIDUzLjQgMCA1MS41UzEuNiA0OCAzLjUgNDhoM3ptNTAtMjFjMS45IDAgMy41IDEuNiAzLjUgMy41UzU4LjQgMzQgNTYuNSAzNGgtMzVjLTEuOSAwLTMuNS0xLjYtMy41LTMuNXMxLjYtMy41IDMuNS0zLjVoMzV6bS01MCAwYzEuOSAwIDMuNSAxLjYgMy41IDMuNVM4LjQgMzQgNi41IDM0aC0zQzEuNiAzNCAwIDMyLjQgMCAzMC41UzEuNiAyNyAzLjUgMjdoM3ptNTAtMjFDNTguNCA2IDYwIDcuNiA2MCA5LjVTNTguNCAxMyA1Ni41IDEzaC0zNWMtMS45IDAtMy41LTEuNi0zLjUtMy41UzE5LjYgNiAyMS41IDZoMzV6bS01MCAwQzguNCA2IDEwIDcuNiAxMCA5LjVTOC40IDEzIDYuNSAxM2gtM0MxLjYgMTMgMCAxMS40IDAgOS41UzEuNiA2IDMuNSA2aDN6IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==);
    background-size: 25px 25px;
    z-index: 999;
}

@media (min-width: 768px) {
    .toc-button {
        display: none !important;
    }
}

.mw-toc {
    display: inline-block;
    width: 250px;
    max-width: 60%;
    height: 100%;
    top: 0;
    padding: 0 7px;
    right: -100%;
    z-index: 9999;
    border: none;
    overflow-y: auto;
    background-color: #fff;
    position: fixed;
    transition: all 0.5s;
    font-size: 95%;
}

.mw-toc.opentoc {
    right: 0;
}

.mw-toc .mw-toctitle {
    line-height: 30px;
    text-align: left !important;
    padding-bottom: 12px;
    padding-left: 1.6em;
    border-bottom: 1px solid #ccc;
    margin-top: 40px;
    display: flex;
    align-items: center;
}

.mw-toc i.toc-close {
    transform: scale(-1);
    position: absolute;
    width: 20px;
    height: 20px;
    left: 9px;
    cursor: pointer;
    background-image: url(data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI0NDRDBENyIgZD0iTTg3Ny4zOTcgNTMzLjYzMmE0Mi42NjcgNDIuNjY3IDAgMDEtNDIuNjY2IDQyLjY2N0gzMTYuNjcybDIyOC4yMjQgMjI4LjI2NmE0Mi42NjcgNDIuNjY3IDAgMDEtNjAuMzMgNjAuMzMxTDE4Mi44NjggNTYzLjJhNDIuNjY3IDQyLjY2NyAwIDAxMC02MC4zM2wzMDEuNjU0LTMwMS43NGE0Mi42NjcgNDIuNjY3IDAgMDE2MC4zNzMgNjAuMzc0TDMxNS4zNDkgNDkwLjk2NWg1MTkuMzgyYTQyLjY2NyA0Mi42NjcgMCAwMTQyLjY2NiA0Mi42Njd6Ii8+PC9zdmc+);
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: 20px;
}

.mw-toc .mw-toctitle h2 {
    display: inline-block;
    margin: 0;
    margin-left: 15px;
    font-size: 20px;
    font-weight: bold;
    border: none;
    padding: 0;
}

.mw-toc ul {
    margin: 0;
    padding: 0px 0 0 20px;
    list-style: none;
    list-style-type: none;
}

.mw-toc>ul {
    max-height: calc(100% - 75px);
    overflow-y: auto;
    position: relative;
}

.mw-toc li {
    padding: 0;
    padding-top: 10px;
    margin: 10px 0;
}

.mw-toc li>ul {
    display: none;
}

.mw-toc ul li a {
    display: inline-block;
    width: 100%;
    color: #000 !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mw-toc .tocnumber,
.mw-toc .toctext {
    display: inline !important;
}

.mw-toc .toclevel-1>a span {
    font-size: 110%;
    font-weight: 600;
    color: #000;
}

.mw-toc .toclevel-2>a span,
.mw-toc .toclevel-3>a span {
    font-size: 100%;
    font-weight: 700;
    color: #666;
}

.mw-toc ul>li.toclevel-1 {
    padding-left: 10px;
}

.mw-toc li>i {
    display: inline-block;
    position: absolute;
    width: 25px;
    height: 20px;
    cursor: pointer;
    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTcuNyAxMC40TDQuMSA2LjljLS4xLS4yLS4xLS42IDAtLjguMi0uMS42LS4xLjggMEw4IDkuM2wzLjItMy4yYy4yLS4yLjUtLjIuNyAwcy4yLjUgMCAuN2wtMy41IDMuNWMtLjIuMy0uNS4zLS43LjF6IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==);
    background-size: 25px;
    background-position: 50%;
    background-repeat: no-repeat;
    transition: all 0.3s;
    background-color: rgb(221 221 221 / 40%);
    border-radius: 5px;
}

.mw-toc .toclevel-1 i {
    left: 0px;
}

.mw-toc .toclevel-2 i {
    left: 20px;
}

.mw-toc .toclevel-3 i {
    left: 40px;
}

.mw-toc .toclevel-4 i {
    left: 60px;
}

.mw-toc .toclevel-5 i {
    left: 80px;
}

.mw-toc li i:hover {
    background-color: #e3e3e3;
}

.mw-toc li i.active {
    transform: scale(-1);
}
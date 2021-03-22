'use strict';

import Util from "./util.js"

let state

class State {
    constructor(contentsList, stateEventHandler) {
        this.contentsList = contentsList
        this.contentsCacheDict = {}
        this.pageNum = 0

        this.intersectionObserver = State.createIntersectionObserver()
        this.onResize()
    }

    static numberOfCols() {
        const viewportWidth = window.innerWidth
        return 1000 < viewportWidth ? 3 : viewportWidth < 599 ? 1 : 2
    }

    static createIntersectionObserver() {
        const intersectionHandler = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("shown")
                }
            })
        }
        const options = {
            root: null,
            rootMargin: "0px",
            threshold: 0.3
        }

        return new IntersectionObserver(intersectionHandler, options)
    }

    onResize() {
        const newCols = State.numberOfCols()
        if (newCols != this.cols) {
            this
            this.cols = newCols
            this.inflateContents(this.contentsList, 16, this.cols, this.pageNum)
        }
    }

    inflateContents(contentsList, contentsNum, cols, pageNum) {
        let contentsContainer = document.getElementById("contents_container")
        while (contentsContainer.firstChild) {
            contentsContainer.removeChild(contentsContainer.firstChild)
        }

        const colsDOM = Util.range(0, cols, 1).map(_ => {
            const column = document.createElement("div")
            column.setAttribute("class", "column")

            return column
        })

        const conetntsPromises = contentsList.slice(pageNum * contentsNum, (pageNum + 1) * contentsNum).map(contentURL => {
            return this.getContent(contentURL)
        })

        Promise.all(conetntsPromises).then(contents => {
            contents.forEach((content, index) => {
                let columnDOM = colsDOM[index % cols]
                columnDOM.appendChild(this.getContentDOM(content))
            })

            colsDOM.forEach(colDOM => {
                let columnWrapper = document.createElement("div")
                columnWrapper.appendChild(colDOM)
                contentsContainer.appendChild(columnWrapper)
            })
        })
    }

    getContent(url) {
        if (url in this.contentsCacheDict) {
            return this.contentsCacheDict[url]
        }

        return fetch(url)
            .then(response => {
                return response.json()
            }).then(content => {
                this.contentsCacheDict[url] = content
                return content
            })
    }

    getContentDOM(content) {
        let defaultImageSource = {
            "src": "images/360x360.png",
            "width": 360,
            "height": 360
        }
        let imageSource = Util.retrieveOrDefault(content, "thumbnail", defaultImageSource)
        let image = document.createElement("img")
        image.setAttribute("src", imageSource.src)
        image.setAttribute("width", imageSource.width)
        image.setAttribute("height", imageSource.height)
        image.setAttribute("class", "thumbnail")
        image.setAttribute("load", "lazy")

        let thumbnail = document.createElement("div")
        thumbnail.appendChild(image)

        let titleString = Util.retrieveOrDefault(content, "title", "")
        let title = document.createElement("h1")
        title.textContent = titleString

        let descriptionString = Util.retrieveOrDefault(content, "description", "")
        let description = document.createElement("p")
        description.textContent = descriptionString

        let label = document.createElement("div")
        label.appendChild(title)
        label.appendChild(description)

        let contentNode = document.createElement("div")
        contentNode.appendChild(thumbnail)
        contentNode.appendChild(label)
        contentNode.setAttribute("class", "fadein")
        this.intersectionObserver.observe(contentNode)
        return contentNode
    }
}

window.onload = (_) => {
    fetch("contents-list.json")
        .then(response => {
            return response.json()
        })
        .then(responseJSON => {
            onContentsListReceived(responseJSON)
        })
}

window.onresize = (_) => {
    state.onResize()
}

function onContentsListReceived(contentsList) {
    state = new State(contentsList)
}

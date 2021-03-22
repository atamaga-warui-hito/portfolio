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

        const contentsPromises = contentsList.slice(pageNum * contentsNum, (pageNum + 1) * contentsNum).map(contentDesc => {
            return this.getContent(contentDesc)
        })

        Promise.all(contentsPromises).then(contents => {
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

    getContent(contentDesc) {
        if (contentDesc.contentPath in this.contentsCacheDict) {
            return this.contentsCacheDict[contentDesc.contentPath]
        }

        return fetch(contentDesc.contentPath)
            .then(response => {
                return response.json()
            }).then(content => {
                content.author = contentDesc.author
                content.tag = contentDesc.tag
                this.contentsCacheDict[contentDesc] = content
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
        description.setAttribute("class", "description")

        let authorsString = Util.retrieveOrDefault(content, "author", []).join(", ")
        let authors = document.createElement("p")
        authors.textContent = authorsString
        authors.setAttribute("class", "author")

        let tagsList = Util.retrieveOrDefault(content, "tag", [])
        let tags = document.createElement("div")
        tags.style.display = "flex"
        tagsList.forEach(tagString => {
            let tag = document.createElement("p")
            tag.textContent = tagString
            tag.setAttribute("class", tagString)
            tags.appendChild(tag)
        })

        let label = document.createElement("div")
        label.appendChild(title)
        label.appendChild(description)
        label.appendChild(authors)
        label.appendChild(tags)

        let contentNode = document.createElement("div")
        contentNode.appendChild(thumbnail)
        contentNode.appendChild(label)
        contentNode.setAttribute("class", "fadein")
        contentNode.classList.add("upin")
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

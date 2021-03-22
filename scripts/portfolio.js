'use strict';

import Util from "./util.js"

let state

class State {
    constructor(contentsList, stateEventHandler) {
        this.contentsList = contentsList
        this.contentsCacheDict = {}
        this.pageNum = 0
        this.cols = State.numberOfCols()
        this.inflateContents(contentsList, 16, this.cols, this.pageNum)
    }

    static numberOfCols() {
        return 1000 < window.innerWidth ? 3 : 1
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

function onContentsListReceived(contentsList) {
    state = new State(contentsList)
}

'use strict';

let state

function State(contentsList, stateEventHandler) {
    this.contentsList = contentsList
    this.appendingIndex = 0
    inflateContents(contentsList, 4)

    function inflateContents(contentsList, columnCount) {
        contentsList.forEach((contentURL, index) => {
            let addColumnIndex = index % columnCount

            getContentDOM(contentURL)
                .then(content => {
                    let column = document.getElementsByClassName("column")[addColumnIndex]
                    column.appendChild(content)
                })
        })
    }

    function getContentDOM(url) {
        return fetch(url)
            .then(response => {
                return response.json()
            }).then(responseJSON => {
                let imageSource = retrieveOrDefault(responseJSON, "thumbnail", "images/360x360.png")
                let image = document.createElement("img")
                image.setAttribute("src", imageSource)
                image.setAttribute("class", "thumbnail")

                let thumbnail = document.createElement("div")
                thumbnail.appendChild(image)

                let titleString = retrieveOrDefault(responseJSON, "title", "")
                let title = document.createElement("h1")
                title.textContent = titleString

                let descriptionString = retrieveOrDefault(responseJSON, "description", "")
                let description = document.createElement("p")
                description.textContent = descriptionString

                let label = document.createElement("div")
                label.appendChild(title)
                label.appendChild(description)

                let contentNode = document.createElement("div")
                contentNode.appendChild(thumbnail)
                contentNode.appendChild(label)
                return contentNode
            })
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

function retrieveOrDefault(object, key, defaultValue) {
    if (object.hasOwnProperty(key)) {
        return object[key]
    } else {
        return defaultValue
    }
}

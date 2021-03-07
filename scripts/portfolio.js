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
                let contentNode = document.createElement("a")
                contentNode.setAttribute("href", responseJSON.externalLink)
                contentNode.textContent = responseJSON.title
                return contentNode
            })
    }
}

window.onload = (_) => {
    fetch("../contents-list.json")
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

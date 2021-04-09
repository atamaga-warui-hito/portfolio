'use strict';

import State from "./portfolio_state.js"
import View from "./portfolio_view.js"

let state
let view

window.onload = (_) => {
    window.scrollTo(0, 0)
    fetch("contents-list.json")
        .then(response => {
            return response.json()
        })
        .then(responseJSON => {
            onContentsListReceived(responseJSON)
        })
}

window.onresize = (_) => {
    view.onResize(state.getPageContents())
}

window.onpopstate = (popState) => {
    if (popState.state) {
        state.deserialize(popState.state)
    } else {
        const params = new URLSearchParams(window.location.search)
        const storeFromParams = parseParamsToStore(params)
        state.deserialize(storeFromParams)
    }
}

function onContentsListReceived(contentsList) {
    view = new View(document, (viewEvent, eventValue) => {
        switch (viewEvent) {
            case "selectAuthor":
                state.selectAuthor(eventValue)
                break
            case "selectTag":
                state.selectTag(eventValue)
                break
            case "selectContent":
                state.selectContent(eventValue)
                break
            case "selectPage":
                state.selectPage(eventValue)
                break
            case "deselectContent":
                if (history.state) {
                    history.back()
                } else {
                    closePopup()
                }
                break
        }
    })

    const params = new URLSearchParams(window.location.search)
    const storeFromParams = parseParamsToStore(params)

    state = new State(contentsList, storeFromParams, 12, (stateEvent, eventValue, store) => {
        switch (stateEvent) {
            case "deserialize":
                showPage(eventValue)
                break
            case "author":
            case "tag":
            case "page":
            case "content":
                history.pushState(store, "", "?" + storeToParams(store).toString())
                showPage(eventValue)
                break
        }
    })
}

function showPage(pageState) {
    if (pageState.selectedContent) {
        view.showPopup(pageState.selectedContent)
    } else {
            view.showHeader()
            view.showAuthors(pageState.authors)
            view.showTags(pageState.tags)
            view.showPageIndicator(pageState.pageIndicies)
            view.showPage(pageState.contents)
    }
}

function closePopup() {
    const params = new URLSearchParams(window.location.search)
    params.delete("id")
    const storeFromParams = parseParamsToStore(params)
    view.hidePopup()
    history.replaceState(null, "", "?" + params.toString())
    state.deserialize(storeFromParams)
}

function storeToParams(store) {
    const storeForParams = {}

    if (!(isAllEnabled(store.authorsList))) {
        storeForParams.auth = Object.keys(store.authorsList).filter(author => {
            return store.authorsList[author]
        })
    }

    if (!(isAllEnabled(store.tagsList))) {
        storeForParams.tag = Object.keys(store.tagsList).filter(tag => {
            return store.tagsList[tag]
        })
    }

    if (store.page) {
        storeForParams.p = store.page
    }

    if (store.contentID) {
        storeForParams.id = store.contentID
    }

    return new URLSearchParams(storeForParams)
}

function isAllEnabled(enabledDict) {
    return Object.keys(enabledDict).reduce((acc, key) => {
        return acc && enabledDict[key]
    }, true)
}

function parseParamsToStore(params) {
    const storedState = {}

    if (params.has("auth")) {
        storedState.authorsList = params.get("auth").split(",").reduce((acc, author) => {
            acc[author] = true
            return acc
        }, {})
    }

    if (params.has("tag")) {
        storedState.tagsList = params.get("tag").split(",").reduce((acc, tag) => {
            acc[tag] = true
            return acc
        }, {})
    }

    if (params.has("p")) {
        storedState.page = params.get("p")
    }

    if (params.has("id")) {
        storedState.contentID = params.get("id")
    }

    return storedState
}
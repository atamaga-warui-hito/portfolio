'use strict';

import Util from "./util.js"

export default class State {
    contentsList
    authorsList
    tagsList
    page
    selectedContentID
    contentsNumInPage
    stateEventHandler
    contentCacheDict

    constructor(contentsList, store, contentsNumInPage, stateEventHandler) {
        this.contentsList = contentsList.map(contentDesc => {
            const updated = Util.clone(contentDesc)
            const id = Util.removeExtension(contentDesc.contentPath)
            updated.id = id
            return updated
        })
        this.page = 0
        this.selectedContentID = null
        this.contentsNumInPage = contentsNumInPage
        this.stateEventHandler = stateEventHandler
        this.contentsCacheDict = {}

        this.setupAuthorsList()
        this.setupTagsList()

        this.deserialize(store)
    }

    serialize() {
        return {
            authorsList: Util.clone(this.authorsList),
            tagsList: Util.clone(this.tagsList),
            page: this.page,
            contentID: this.selectedContentID
        }
    }

    deserialize(serialized) {
        if (Object.keys(serialized).length === 0) {
            this.page = 0
            this.selectedContentID = null
            this.setupAuthorsList()
            this.setupTagsList()
        }

        if (serialized.authorsList) {
            Object.keys(this.authorsList).forEach(author => {
                if (typeof serialized.authorsList[author] === "undefined") {
                    this.authorsList[author] = false
                } else {
                    this.authorsList[author] = serialized.authorsList[author]
                }
            })
        }

        if (serialized.tagsList) {
            Object.keys(this.tagsList).forEach(tag => {
                if (typeof serialized.tagsList[tag] === "undefined") {
                    this.tagsList[tag] = false
                } else {
                    this.tagsList[tag] = serialized.tagsList[tag]
                }
            })
        }

        if (serialized.page && parseInt(serialized.page)) {
            const totalPages = this.getTotalPages()
            const page = parseInt(serialized.page)
            if (0 <= page && page < totalPages) {
                this.page = page
            }
        }

        if (serialized.contentID) {
            if (this.contentsList.filter(contentDesc => contentDesc.id === serialized.contentID)[0]) {
                this.selectedContentID = serialized.contentID
            }
        } else {
            this.selectedContentID = null
        }

        this.publishState("deserialize")
    }

    publishState(trigger) {
        const selectedContentDesc = this.contentsList.filter(contentDesc => contentDesc.id === this.selectedContentID)[0]
        const selectedContent = selectedContentDesc ? this.getContent(selectedContentDesc) : null

        this.stateEventHandler(trigger, {
            authors: this.authorsList,
            tags: this.tagsList,
            contents: this.getPageContents(),
            pageIndicies: this.getPageIndicies(),
            selectedContent: selectedContent
        }, this.serialize())
    }

    selectAuthor(author) {
        this.page = 0
        this.authorsList[author] = !this.authorsList[author]

        if (author === "all") {
            Object.keys(this.authorsList).forEach(author => {
                this.authorsList[author] = this.authorsList["all"]
            })
        }

        this.publishState("author")
    }

    selectTag(tag) {
        this.page = 0
        this.tagsList[tag] = !this.tagsList[tag]

        if (tag === "all") {
            Object.keys(this.tagsList).forEach(tag => {
                this.tagsList[tag] = this.tagsList["all"]
            })
        }

        this.publishState("tag")
    }

    selectPage(page) {
        this.page = parseInt(page, 10)
        this.publishState("page")
    }

    selectContent(contentID) {
        this.selectedContentID = contentID
        this.publishState("content")
    }

    getPageIndicies() {
        const totalPages = this.getTotalPages()

        return Util.range(0, totalPages, 1).reduce((acc, pageNum) => {
            acc[pageNum] = pageNum == this.page ? true : false

            return acc
        }, {})
    }

    getPageContents() {
        return this.getActiveContentsList()
            .slice(this.page * this.contentsNumInPage, (this.page + 1) * this.contentsNumInPage)
            .map(contentDesc => {
                return this.getContent(contentDesc)
            })
    }

    getActiveContentsList() {
        const enabledAuthors = Object.keys(this.authorsList).filter(author => {
            return this.authorsList[author]
        })

        const enabledTags = Object.keys(this.tagsList).filter(tag => {
            return this.tagsList[tag]
        })

        const activeContents = this.contentsList.filter(contentDesc => {
            const isAuthorsEnabled = contentDesc.authors.reduce((acc, author) => {
                return acc || enabledAuthors.includes(author)
            }, false)

            const isTagsEnabled = contentDesc.tags.reduce((acc, tag) => {
                return acc || enabledTags.includes(tag)
            }, false)

            return isAuthorsEnabled && isTagsEnabled
        })

        return activeContents.filter((content) => {
            const now = dayjs().unix()
            const publishedOnUnixtime = dayjs(content.publishedOn).unix()
            return publishedOnUnixtime < now
        }).sort((a, b) => {
            const aDate = dayjs(a.publishedOn).unix()
            const bDate = dayjs(b.publishedOn).unix()
            return bDate - aDate
        })
    }

    getContent(contentDesc) {
        if (contentDesc.contentPath in this.contentsCacheDict) {
            return new Promise((resolve, _) => {
                resolve(this.contentsCacheDict[contentDesc.contentPath])
            })
        }

        return fetch(contentDesc.contentPath)
            .then(response => {
                return response.json()
            }).then(content => {
                content.authors = contentDesc.authors
                content.tags = contentDesc.tags
                content.publishedOn = contentDesc.publishedOn
                content.id = contentDesc.id
                this.contentsCacheDict[contentDesc] = content
                return content
            })
    }

    getTotalPages() {
        return parseInt((this.getActiveContentsList().length - 1) / this.contentsNumInPage, 10) + 1
    }

    setupAuthorsList() {
        this.authorsList = this.contentsList.reduce((acc, content) => {
            content.authors.forEach(authorName => {
                acc[authorName] = true
            })

            return acc
        }, { all: true })
    }

    setupTagsList() {
        this.tagsList = this.contentsList.reduce((acc, content) => {
            content.tags.forEach(tagName => {
                acc[tagName] = true
            })

            return acc
        }, { all: true })
    }
}

export default class Util {
    static range(start, stop, step) {
        return Array.from({ length: (stop - start) / step }, (_, i) => start + (i * step))
    }

    static retrieveOrDefault(obj, key, defaultValue) {
        if (obj.hasOwnProperty(key)) {
            return obj[key]
        } else {
            return defaultValue
        }
    }
}
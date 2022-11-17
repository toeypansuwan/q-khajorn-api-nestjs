import Bookshelf from "bookshelf";

export namespace IBookshelf {


    export interface FetchOptions extends Bookshelf.FetchOptions {
        excludeColumns?: string[];
    }

    export interface FetchAllOptions extends Bookshelf.FetchAllOptions {
        excludeColumns?: string[];
    }
    export interface FetchPageOptions extends Bookshelf.FetchPageOptions {
        excludeColumns?: string[];
    }

    export interface SerializeOptions extends Bookshelf.SerializeOptions {
        markDataColumns?: string[];
    }

}
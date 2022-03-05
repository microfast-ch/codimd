/* eslint-env browser, jquery */
/* global serverurl, moment */

import store from 'store'
import LZString from '@hackmd/lz-string'

import escapeHTML from 'lodash/escape'

import {
  checkNoteIdValid,
  encodeNoteId
} from './utils'

import { checkIfAuth } from './lib/common/login'

import { urlpath } from './lib/config'

function renderCompanyNotes(title, tags) {
  // console.debug(tags);
  const id = urlpath ? location.pathname.slice(urlpath.length + 1, location.pathname.length).split('/')[1] : location.pathname.split('/')[1]
  return {
    id,
    text: title,
    time: moment().valueOf(),
    tags
  }
}

function generateCompanyNotes(title, tags, companyNotes) {
  const info = renderCompanyNotes(title, tags)
  // keep any pinned data
  let pinned = false
  for (let i = 0; i < companyNotes.length; i++) {
    if (companyNotes[i].id === info.id && companyNotes[i].pinned) {
      pinned = true
      break
    }
  }
  return companyNotes;
}

export function saveCompany(companyNotes) {
  checkIfAuth(
    () => {
      saveCompanyNotesToStorage(companyNotes)
    },
    () => {
      saveCompanyNotesToStorage(companyNotes)
    }
  )
}

function saveCompanyNotesToStorage(companyNotes) {
  store.set('notehistory', JSON.stringify(companyNotes))
}

// used for outer
export function getCompanyNotes(callback) {
  checkIfAuth(
    () => {
      getServerCompanyNotes(callback)
    },
    () => {
      getStorageCompanyNotes(callback)
    }
  )
}

function getServerCompanyNotes(callback) {
  $.get(`${serverurl}/api/notes`)
    .done(data => {
      if (data.notes) {
        callback(data.notes)
      }
    })
    .fail((xhr, status, error) => {
      console.error(xhr.responseText)
    })
}

export function getStorageCompanyNotes(callback) {
  let data = store.get('companynotes')
  if (data) {
    if (typeof data === 'string') { data = JSON.parse(data) }
    callback(data)
  }
  // eslint-disable-next-line standard/no-callback-literal
  callback([])
}

export function parseCompanyNotes(list, callback) {
  checkIfAuth(
    () => {
      parseServerToCompanyNotes(list, callback)
    },
    () => {
      parseStorageToCompanyNotes(list, callback)
    }
  )
}

export function parseServerToCompanyNotes(list, callback) {
  $.get(`${serverurl}/api/notes`)
    .done(data => {
      if (data.notes) {
        parseToCompanyNotes(list, data.notes, callback)
      }
    })
    .fail((xhr, status, error) => {
      console.error(xhr.responseText)
    })
}

export function parseStorageToCompanyNotes(list, callback) {
  let data = store.get('companynotes')
  if (data) {
    if (typeof data === 'string') { data = JSON.parse(data) }
    parseToCompanyNotes(list, data, callback)
  }
  parseToCompanyNotes(list, [], callback)
}

function parseToCompanyNotes(list, companyNotes, callback) {
  if (!callback) return
  else if (!list || !companyNotes) callback(list, companyNotes)
  else if (companyNotes && companyNotes.length > 0) {
    for (let i = 0; i < companyNotes.length; i++) {
      // migrate LZString encoded id to base64url encoded id
      try {
        const id = LZString.decompressFromBase64(companyNotes[i].id)
        if (id && checkNoteIdValid(id)) {
          companyNotes[i].id = encodeNoteId(id)
        }
      } catch (err) {
        console.error(err)
      }
      // parse time to timestamp and fromNow
      const timestamp = moment(companyNotes[i].createdAt)
      companyNotes[i].timestamp = timestamp.valueOf()
      companyNotes[i].fromNow = timestamp.fromNow()
      companyNotes[i].createdAt = timestamp.format('llll')
      // prevent XSS
      companyNotes[i].text = escapeHTML(companyNotes[i].text)
      companyNotes[i].tags = (companyNotes[i].tags && companyNotes[i].tags.length > 0) ? escapeHTML(companyNotes[i].tags).split(',') : []
      // add to list
      if (companyNotes[i].id && list.get('id', companyNotes[i].id).length === 0) { list.add(companyNotes[i]) }
    }
  }
  callback(list, companyNotes)
}

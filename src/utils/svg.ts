import sharp from 'sharp'
import path from 'path'
import fs from 'fs-extra'
import config from '@arasaac/config'

import { pluralSVGCode, pastSVGCode, futureSVGCode, identitySVGCode, identityBNSVGCode } from '../utils/svgCodes'

const skin = {
  white: '#F5E5DE',
  black: '#A65C17',
  assian: '#F4ECAD',
  mulatto: '#E3AB72',
  aztec: '#CF9D7C',
  schematic: '#FEFEFE',
}
const hair = {
  brown: '#A65E26',
  blonde: '#FDD700',
  red: '#ED4120',
  black: '#020100',
  gray: '#EFEFEF',
  darkGray: '#AAABAB',
  darkBrown: '#6A2703',
}

const getNextLayer = (layer) => {
  const layers = ['Fondo', 'contorno2', 'relleno', 'contorno']
  const layerIndex = layers.indexOf(layer) + 1
  if (layerIndex < 4) {
    return `<g id="${layers[layerIndex]}">`
  }
  return '</svg>'
}

const identifierCode = (type, position = 'right', color) =>
  color ? identitySVGCode[type][position] : identityBNSVGCode[type][position]

const modifyLayer = (fileContent, layer, layerText) => {
  const startAt = `<g id="${layer}">`
  const finishAt = getNextLayer(layer)
  let s = fileContent.indexOf(startAt)
  let f = fileContent.indexOf(finishAt)
  return `${fileContent.substr(0, s)}<g id="${layer}">${layerText}</g>\n${fileContent.substr(f)}`
}

const addLayer = (fileContent, layer, layerText) => {
  let s = fileContent.indexOf('</svg>')
  return `${fileContent.substr(0, s)}<g id="${layer}">${layerText}</g>\n</svg>`
}

export const getPNGFileName = async (file, options) => {
  const { plural, color, backgroundColor, action, resolution, identifier, identifierPosition } = options
  const idFile = path.basename(file, '.svg')
  let fileName = idFile
  if (plural) fileName = `${fileName}_plural`
  if (!color) fileName = `${fileName}_nocolor`
  if (backgroundColor) fileName = `${fileName}_backgroundColor-${backgroundColor.replace('#', '').toUpperCase()}`
  if (action !== 'present') fileName = `${fileName}_action-${action}`
  if (options.hair) fileName = `${fileName}_hair-${hair[options.hair].substr(1, 6)}`
  if (options.skin) fileName = `${fileName}_skin-${skin[options.skin].substr(1, 6)}`
  fileName = `${fileName}_${resolution}`
  if (identifier) {
    fileName = `${fileName}_identifier-${identifier}`
    if (identifierPosition === 'left') fileName = `${fileName}-${identifierPosition}`
  }
  await fs.ensureDir(path.resolve(config.IMAGE_DIR, idFile))
  return path.resolve(config.IMAGE_DIR, idFile, `${fileName}.png`)
}

const skinsToRemove = `${skin.white}|${skin.schematic}`
const reSkin = new RegExp(skinsToRemove, 'gim')
const modifySkin = (fileContent, key) => fileContent.replace(reSkin, skin[key])

const hairToRemove = () => {
  let value = ''
  Object.keys(hair).forEach(function (key) {
    value += `${hair[key]}|`
  })
  return value.slice(0, -1)
}
const reHair = new RegExp(hairToRemove(), 'gim')
const modifyHair = (fileContent, key) => fileContent.replace(reHair, hair[key])

export const modifySVG = (fileContent, options) => {
  let content = fileContent
  const { plural, color, backgroundColor, action, hair, skin, identifier, identifierPosition } = options
  if (plural) content = addLayer(content, 'plural', pluralSVGCode)
  if (backgroundColor)
    content = modifyLayer(
      content,
      'Fondo',
      `<rect x="-55" y="147" style="fill:${backgroundColor};" width="500" height="500"/>`,
    )
  if (!color) content = modifyLayer(content, 'relleno', '')
  if (action === 'future') content = addLayer(content, 'action', futureSVGCode)
  else if (action === 'past') content = addLayer(content, 'action', pastSVGCode)
  if (hair) content = modifyHair(content, hair)
  if (skin) content = modifySkin(content, skin)
  if (identifier) {
    content = addLayer(content, 'identifier', identifierCode(identifier, identifierPosition, color))
  }
  /* eslint-enable no-param-reassign */
  return content
}

export const convertSVG = (fileContent, resolution) => {
  // density 450p is for 3125x image
  const density: number = parseInt(String(0.144 * resolution), 10)
  const fileBuffer = Buffer.from(fileContent)
  return sharp(fileBuffer, { density }).png().toBuffer()
}

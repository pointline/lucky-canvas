import React from 'react'
import Taro from '@tarojs/taro'
import { View, Canvas, CoverView, Image } from '@tarojs/components'
import { LuckyWheel as Wheel } from 'lucky-canvas'
import { changeUnits, resolveImage, getFlag, getImage } from '../utils'
import '../utils/index.css'

export default class LuckyWheel extends React.Component {
  flag = getFlag()
  ctx = null
  canvas = null
  state = {
    imgSrc: '',
    myLucky: null,
    boxWidth: 300,
    boxHeight: 300,
    btnWidth: 0,
    btnHeight: 0,
  }

  constructor (props) {
    super(props)
  }

  componentDidMount () {
    this.initLucky()
  }

  componentDidUpdate (prevProps) {
    const { props, state } = this
    if (!state.myLucky) return
    if (props.blocks !== prevProps.blocks) {
      state.myLucky.blocks = props.blocks
    }
    if (props.prizes !== prevProps.prizes) {
      state.myLucky.prizes = props.prizes
    }
    if (props.buttons !== prevProps.buttons) {
      state.myLucky.buttons = props.buttons
    }
  }

  async imgBindload (res, name, index, i) {
    const img = this.props[name][index].imgs[i]
    resolveImage(img, this.canvas)
  }

  getImage () {
    const page = Taro.getCurrentInstance().page
    return getImage.call(page, this.props.canvasId, this.canvas)
  }

  showCanvas () {
    this.setState({ imgSrc: '' })
  }

  hideCanvas () {
    if (this.flag === 'WEB') return
    this.getImage().then(res => {
      if (res.errMsg !== 'canvasToTempFilePath:ok') {
        return console.error(res)
      }
      this.setState({
        imgSrc: res.tempFilePath
      })
    })
  }

  initLucky () {
    const { props } = this
    this.setState({
      boxWidth: changeUnits(props.width),
      boxHeight: changeUnits(props.height)
    }, () => {
      // 某些情况下获取不到 canvas
      setTimeout(() => {
        this.getConfig()
      }, 100)
    })
  }

  getConfig () {
    let flag = this.flag
    const dpr = this.dpr = Taro.getSystemInfoSync().pixelRatio
    if (flag === 'WEB') {
      // H5 环境
      const divElement = document.querySelector('#lucky-box')
      this.drawLucky({
        dpr,
        flag,
        divElement,
        width: this.state.boxWidth,
        height: this.state.boxHeight,
        rAF: requestAnimationFrame,
      })
    } else {
      // 小程序环境
      const page = Taro.getCurrentInstance().page
      Taro.createSelectorQuery().in(page).select(`#${this.props.canvasId}`).fields({
        node: true, size: true
      }).exec((res) => {
        if (!res[0] || !res[0].node) return console.error('lucky-canvas 获取不到 canvas 标签')
        const { node, width, height } = res[0]
        const canvas = this.canvas = node
        const ctx = this.ctx = canvas.getContext('2d')
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        this.drawLucky({
          dpr,
          flag,
          ctx,
          width,
          height,
        })
      })
    }
  }

  drawLucky (config) {
    const _this = this
    const { props, flag, ctx } = this
    const myLucky = new Wheel({
      ...config,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      unitFunc: (num, unit) => changeUnits(num + unit),
      beforeCreate: function () {
        if (flag === 'WEB') return
        const Radius = Math.min(this.config.width, this.config.height) / 2
        ctx.translate(Radius, Radius)
      },
      beforeInit: function () {
        if (flag === 'WEB') return
        ctx.translate(-this.Radius, -this.Radius)
      },
      afterInit: function () {
        // 动态设置按钮大小
        _this.setState({
          btnWidth: this.maxBtnRadius * 2,
          btnHeight: this.maxBtnRadius * 2,
        })
      },
      afterStart: () => {
        this.showCanvas()
      },
    }, {
      ...props,
      start: (...rest) => {
        props.onStart && props.onStart(...rest)
      },
      end: (...rest) => {
        props.onEnd && props.onEnd(...rest)
        this.hideCanvas()
      }
    })
    this.setState({ myLucky })
  }

  play (...rest) {
    this.state.myLucky.play(...rest)
  }

  stop (...rest) {
    this.state.myLucky.stop(...rest)
  }

  toPlay () {
    this.state.myLucky.startCallback()
  }

  render () {
    const { props, state, flag } = this
    const boxSize = { width: state.boxWidth + 'px', height: state.boxHeight + 'px' }
    const btnSize = { width: state.btnWidth + 'px', height: state.btnHeight + 'px' }
    const showImage = state.myLucky && flag !== 'WEB'
    return flag === 'WEB' ? <div id="lucky-box"></div> : (
      <View className="lucky-box" style={boxSize}>
        <Canvas type="2d" className="lucky-canvas" id={props.canvasId} canvasId={props.canvasId} style={boxSize}></Canvas>
        <Image src={state.imgSrc} onLoad={() => state.myLucky.clearCanvas()} style={boxSize}></Image>
        {/* 按钮 */}
        <View className="lucky-wheel-btn" onTouchstart={e => this.toPlay(e)} style={btnSize}></View>
        {/* 图片 */}
        { showImage ? <View className="lucky-imgs">
          {
            props.blocks.map((block, index) => <View key={index}>
              {
                block.imgs ? <View>
                  { block.imgs.map((img, i) => <Image key={i} src={img.src} onLoad={e => this.imgBindload(e, 'blocks', index, i)}></Image>) }
                </View> : null
              }
            </View>)
          }
        </View> : null }
        { showImage ? <View className="lucky-imgs">
          {
            props.prizes.map((prize, index) => <View key={index}>
              {
                prize.imgs ? <View>
                  { prize.imgs.map((img, i) => <Image key={i} src={img.src} onLoad={e => this.imgBindload(e, 'prizes', index, i)}></Image>) }
                </View> : null
              }
            </View>)
          }
        </View> : null }
        { showImage ? <View className="lucky-imgs">
          {
            props.buttons.map((button, index) => <View key={index}>
              {
                button.imgs ? <View>
                  { button.imgs.map((img, i) => <Image key={i} src={img.src} onLoad={e => this.imgBindload(e, 'buttons', index, i)}></Image>) }
                </View> : null
              }
            </View>)
          }
        </View> : null }
      </View>
    )
  }
}

LuckyWheel.defaultProps = {
  canvasId: 'lucky-wheel',
  width: '600rpx',
  height: '600rpx',
  blocks: [],
  prizes: [],
  buttons: [],
  defaultStyle: {},
  defaultConfig: {},
}

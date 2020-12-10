// Styles
import '../VTextField/VTextField.sass'
import './VOtpInput.sass'

// Extensions
import VInput from '../VInput'
import { VRow, VCol } from '../VGrid'

// Mixins
import Intersectable from '../../mixins/intersectable'
import Loadable from '../../mixins/loadable'

// Directives
import ripple from '../../directives/ripple'

// Utilities
import { convertToUnit, keyCodes } from '../../util/helpers'
import { breaking } from '../../util/console'

// Types
import mixins from '../../util/mixins'
import { VNode } from 'vue'

const baseMixins = mixins(
  VInput,
  Intersectable({
    onVisible: [
    ],
  }),
  Loadable,
)
interface options extends InstanceType<typeof baseMixins> {
  $refs: {
    input: HTMLInputElement
  }
}

/* @vue/component */
export default baseMixins.extend<options>().extend({
  name: 'v-otp-input',

  directives: {
    ripple,
  },

  inheritAttrs: false,

  props: {
    autofocus: Boolean,
    fullWidth: Boolean,
    singleLine: Boolean,
    length: {
      type: Number,
      default: 6,
    },
    onFinish: {
      type: Function,
      default: ((rsp: string) => { console.log('onFinish() prop will return', rsp) }) as Function,
    },
    type: {
      type: String,
      default: 'text',
    },
  },

  data: () => ({
    badInput: false,
    initialValue: null,
    isBooted: false,
    otp: [] as string[],
  }),

  computed: {
    classes (): object {
      return {
        ...VInput.options.computed.classes.call(this),
        'v-input--hide-details': true,
        'v-text-field': true,
        'v-otp-input-field': true,
        'v-text-field--full-width': this.fullWidth,
        'v-text-field--enclosed': true,
        'v-text-field--outlined': true,
      }
    },
    computedColor (): string | undefined {
      return this.color || 'primary'
    },
    internalValue: {
      get (): any {
        return this.lazyValue
      },
      set (val: any) {
        this.lazyValue = val
        this.$emit('input', this.lazyValue)
      },
    },
    isDirty (): boolean {
      return this.lazyValue?.toString().length > 0 || this.badInput
    },
    isSingle (): boolean {
      return (
        this.singleLine ||
        this.fullWidth
      )
    },
  },

  watch: {
    isFocused: 'updateValue',
    value (val) {
      this.lazyValue = val
    },
  },

  created () {
    /* istanbul ignore next */
    if (this.$attrs.hasOwnProperty('browser-autocomplete')) {
      breaking('browser-autocomplete', 'autocomplete', this)
    }

    this.otp = this.internalValue?.split('') || []
  },

  mounted () {
    requestAnimationFrame(() => (this.isBooted = true))
  },

  methods: {
    /** @public */
    focus (e: Event, otpIdx: number) {
      this.onFocus(e, otpIdx || 0)
    },
    genInputSlot (otpIdx: number) {
      return this.$createElement('div', this.setBackgroundColor(this.backgroundColor, {
        staticClass: 'v-input__slot',
        style: { height: convertToUnit(this.height) },
        on: {
          click: () => this.onClick(otpIdx),
          mousedown: this.onMouseDown,
          mouseup: (e: Event) => this.onMouseUp(e, otpIdx),
        },
        ref: `input-slot-${otpIdx}`,
      }), [this.genDefaultSlot(otpIdx)])
    },
    genControl (otpIdx: number) {
      return this.$createElement('div', {
        staticClass: 'v-input__control',
      }, [
        this.genInputSlot(otpIdx),
      ])
    },
    genDefaultSlot (otpIdx: number) {
      return [
        this.genFieldset(),
        this.genTextFieldSlot(otpIdx),
      ]
    },
    genCol (otpIdx: number) {
      const node = this.$createElement('div', this.setTextColor(this.validationState, {
        staticClass: 'v-input',
        class: this.classes,
      }), [this.genControl(otpIdx)])

      return this.$createElement(VCol, {
      }, [
        node,
      ])
    },
    genContent () {
      return [
        this.genWrapper(),
      ]
    },
    genWrapper () {
      const cols = [...Array(this.length).keys()].map(x => {
        return this.genCol(x)
      })

      return this.$createElement(VRow, {
        staticClass: 'position-relative row--dense',
      }, cols)
    },
    genFieldset () {
      return this.$createElement('fieldset', {
        attrs: {
          'aria-hidden': true,
        },
      }, [this.genLegend()])
    },
    genLegend () {
      const width = 0
      const span = this.$createElement('span', {
        domProps: { innerHTML: '&#8203;' },
      })

      return this.$createElement('legend', {
        style: {
          width: !this.isSingle ? convertToUnit(width) : undefined,
        },
      }, [span])
    },
    genInput (otpIdx: number) {
      const listeners = Object.assign({}, this.listeners$)
      delete listeners.change // Change should not be bound externally

      return this.$createElement('input', {
        style: {},
        domProps: {
          value: (this.type === 'number' && Object.is(this.lazyValue, -0)) ? '-0' : this.otp[otpIdx],
        },
        attrs: {
          ...this.attrs$,
          autofocus: this.autofocus,
          disabled: this.isDisabled,
          id: `${this.computedId}--${otpIdx}`,
          readonly: this.isReadonly,
          type: this.type,
          maxlength: 1,
        },
        on: Object.assign(listeners, {
          blur: this.onBlur,
          input: (e: Event) => this.onInput(e, otpIdx),
          focus: (e: Event) => this.onFocus(e, otpIdx),
          paste: (e: ClipboardEvent) => this.onPaste(e, otpIdx),
          keydown: this.onKeyDown,
          keyup: (e: KeyboardEvent) => this.onKeyUp(e, otpIdx),
        }),
        ref: `input-${otpIdx}`,
      })
    },
    genMessages () {
      return null
    },
    genTextFieldSlot (otpIdx: number): VNode {
      return this.$createElement('div', {
        staticClass: 'v-text-field__slot',
      }, [
        this.genInput(otpIdx),
      ])
    },
    onBlur (e?: Event) {
      this.isFocused = false
      e && this.$nextTick(() => this.$emit('blur', e))
    },
    onClick (otpIdx: number) {
      if (this.isFocused || this.isDisabled || !this.$refs[`input-${otpIdx}`]) return

      const input = this.$refs[`input-${otpIdx}`] as HTMLInputElement
      input.focus()
    },
    onFocus (e?: Event, otpIdx?: number) {
      const refKey = 'input-' + otpIdx
      if (!this.$refs[refKey]) return

      if (document.activeElement !== this.$refs[refKey]) {
        const input = this.$refs[refKey] as HTMLInputElement
        input.focus()
        return input.select()
      }

      if (!this.isFocused) {
        this.isFocused = true
        e && this.$emit('focus', e)
      }
    },
    onInput (e: Event, otpIdx: number) {
      const target = e.target as HTMLInputElement
      const value = target.value
      this.applyValue(otpIdx, target.value, () => {
        this.internalValue = this.otp.join('')
      })
      this.badInput = target.validity && target.validity.badInput

      const nextIndex = otpIdx + 1
      if (value) {
        if (nextIndex < this.length) {
          this.changeFocus(nextIndex)
        } else {
          this.clearFocus(otpIdx)
          if (this.otp.length === this.length) { this.onCompleted() }
        }
      }
    },
    clearFocus (index: number) {
      const input = this.$refs[`input-${index}`] as HTMLInputElement
      input.blur()
    },
    onKeyDown (e: KeyboardEvent) {
      if (e.keyCode === keyCodes.enter) this.$emit('change', this.internalValue)

      this.$emit('keydown', e)
    },
    onMouseDown (e: Event) {
      // Prevent input from being blurred
      if (e.target !== this.$refs.input) {
        e.preventDefault()
        e.stopPropagation()
      }

      VInput.options.methods.onMouseDown.call(this, e)
    },
    onMouseUp (e: Event, otpIdx: number) {
      if (this.hasMouseDown) this.focus(e, otpIdx)

      VInput.options.methods.onMouseUp.call(this, e)
    },
    onPaste (event: ClipboardEvent, index: number) {
      const maxCursor = this.length - 1
      // const clipboardData = event?.clipboardData?.getData('Text') ||
      //   window?.clipboardData ||
      //   event?.originalEvent.clipboardData
      const inputVal = event?.clipboardData?.getData('Text')
      const inputDataArray = inputVal?.split('') || []
      event.preventDefault()
      const newOtp: string[] = [...this.otp]
      for (let i = 0; i < inputDataArray.length; i++) {
        const appIdx = index + i
        if (appIdx > maxCursor) break
        newOtp[appIdx] = inputDataArray[i].toString()
      }
      this.otp = newOtp
      const targetFocus = Math.min(index + inputDataArray.length, maxCursor)
      this.changeFocus(targetFocus)

      if (newOtp.length === this.length) { this.onCompleted(); this.clearFocus(targetFocus) }
    },
    applyValue (index: number, inputVal: string, next?: Function) {
      const newOtp: string[] = [...this.otp]
      newOtp[index] = inputVal
      this.otp = newOtp
      if (next) { next() }
    },
    changeFocus (index: number) {
      this.onFocus(undefined, index || 0)
    },
    updateValue (val: boolean) {
      // Sets validationState from validatable
      this.hasColor = val

      if (val) {
        this.initialValue = this.lazyValue
      } else if (this.initialValue !== this.lazyValue) {
        this.$emit('change', this.lazyValue)
      }
    },
    onKeyUp (event: KeyboardEvent, index: number) {
      if (event) {
        event.preventDefault()
        const eventKey = event.key
        if (['Tab', 'Shift', 'Meta', 'Control', 'Alt'].includes(eventKey)) {
          return
        }
        if (['Delete'].includes(eventKey)) {
          return
        }
        if (eventKey === 'ArrowLeft' || (eventKey === 'Backspace' && !this.otp[index])) {
          return index > 0 && this.changeFocus(index - 1)
        }
        if (eventKey === 'ArrowRight') {
          return index + 1 < this.length && this.changeFocus(index + 1)
        }
      }
    },
    onCompleted () {
      const rsp = Object.values(this.otp).join('')
      if (rsp.length === this.length) { this?.onFinish(rsp) } else {
        this.changeFocus(0)
      }
    },
  },
  render (h): VNode {
    return h('div', {
      staticClass: 'v-otp-input',
      class: this.classes,
    }, this.genContent())
  },
})

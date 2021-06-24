// Styles
import '../VTextField/VTextField.sass'
import './VOtpInput.sass'

// Extensions
import VInput from '../VInput'

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
)
interface options extends InstanceType<typeof baseMixins> {
  $refs: {
    input: HTMLInputElement[]
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
    length: {
      type: Number,
      default: 6,
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
        'v-text-field--enclosed': true,
        'v-text-field--outlined': true,
      }
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
      return VInput.options.computed.isDirty.call(this) || this.badInput
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
          mousedown: (e: Event) => this.onMouseDown(e, otpIdx),
          mouseup: (e: Event) => this.onMouseUp(e, otpIdx),
        },
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

      return this.$createElement('div', {
        staticClass: 'col-input',
      }, [
        node,
      ])
    },
    genContent () {
      const cols = [...Array(this.length).keys()].map(x => {
        return this.genCol(x)
      })

      return [this.$createElement('div', {
        staticClass: 'row-container',
      }, cols)]
    },
    genFieldset () {
      return this.$createElement('fieldset', {
        attrs: {
          'aria-hidden': true,
        },
      }, [this.genLegend()])
    },
    genLegend () {
      const span = this.$createElement('span', {
        domProps: { innerHTML: '&#8203;' },
      })

      return this.$createElement('legend', {
        style: {
          width: '0px',
        },
      }, [span])
    },
    genInput (otpIdx: number) {
      const listeners = Object.assign({}, this.listeners$)
      delete listeners.change // Change should not be bound externally

      return this.$createElement('input', {
        style: {},
        domProps: {
          value: this.otp[otpIdx],
          min: this.type === 'number' ? 0 : null,
        },
        attrs: {
          ...this.attrs$,
          disabled: this.isDisabled,
          readonly: this.isReadonly,
          type: this.type,
          id: `${this.computedId}--${otpIdx}`,
          class: `otp-field-box--${otpIdx}`,
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
        ref: 'input',
        refInFor: true,
      })
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
      if (this.isFocused || this.isDisabled || !this.$refs.input[otpIdx]) return

      this.onFocus(undefined, otpIdx)
    },
    onFocus (e?: Event, otpIdx?: number) {
      e?.preventDefault()
      e?.stopPropagation()
      const elements = this.$refs.input as HTMLInputElement[]
      const ref = this.$refs.input && elements[otpIdx || 0]
      if (!ref) return

      if (document.activeElement !== ref) {
        ref.focus()
        return ref.select()
      }

      if (!this.isFocused) {
        this.isFocused = true
        ref.select()
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
          this.onCompleted()
        }
      }
    },
    clearFocus (index: number) {
      const input = this.$refs.input[index] as HTMLInputElement
      input.blur()
    },
    onKeyDown (e: KeyboardEvent) {
      if (e.keyCode === keyCodes.enter) {
        this.$emit('change', this.internalValue)
      }

      this.$emit('keydown', e)
    },
    onMouseDown (e: Event, otpIdx: number) {
      // Prevent input from being blurred
      if (e.target !== this.$refs.input[otpIdx]) {
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
    applyValue (index: number, inputVal: string, next: Function) {
      const newOtp: string[] = [...this.otp]
      newOtp[index] = inputVal
      this.otp = newOtp
      next()
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
    },
    onCompleted () {
      const rsp = this.otp.join('')
      if (rsp.length === this.length) {
        this.$emit('finish', rsp)
      }
    },
  },
  render (h): VNode {
    return h('div', {
      class: 'v-otp-input',
    }, this.genContent())
  },
})

<template>
  <div class="converter" :class="styling">
    <h1>{{ unit.title }}</h1>
    <div class="container">
      <div class="container-selection">
        <input
          type="text"
          placeholder="enter"
          v-model="input"
          @click="output = 0"
        />
        <select v-model="fromUnit">
          <option
            v-for="(option, index) in unit.options"
            :key="index"
            :value="option"
            :disabled="index == 0 ? true : false"
          >
            {{ option }}
          </option>
        </select>
      </div>
      <button type="button" @click="main()">
        <BaseIcon name="refresh-ccw" />
      </button>
      <div class="container-selection">
        <input type="text" disabled="true" :value="output" />
        <select v-model="toUnit">
          <option
            v-for="(option, index) in unit.options"
            :key="index"
            :value="option"
            :disabled="index == 0 ? true : false"
          >
            {{ option }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import ConverterService from '../services/ConverterService.js'

export default {
  name: 'Converter',
  props: ['unit_name'],
  /* props: {
    unit_name: String ,
  }, */

  data() {
    return {
      unit: {}, //just a single unit based on the prop unit_name
      input: '',
      output: 0,
      fromUnit: 'select unit',
      toUnit: 'select unit',
    }
  },

  computed: {
    styling: function () {
      if (this.unit.id === 'length') {
        return 'length'
      } else if (this.unit.id === 'volume') {
        return 'volume'
      } else if (this.unit.id === 'temperature') {
        return 'temperature'
      } else {
        return ''
      }
    },
  },

  methods: {
    /**
     * Removes all white spaces from the input
     *
     * @param   {string} userInput  The user input number.
     * @return  {string} userInput without white spaces.
     */
    removeWhiteSpaces(userInput) {
      console.log('Enter removeWhiteSpaces()')
      console.log(`without whitespaces: ${userInput.replace(/\s/g, '')}`)
      return userInput.replace(/\s/g, '')
    },

    /**
     * Removes all reduntant zeros from the input if any
     *
     * @param   {string} userInput  The user input number
     * @return  {string} userInput without redundant zeros at the beginning and at the end (the latter only applies to
     *                   floating point numbers).
     */
    removeRedundantZeros(userInput) {
      console.log('Enter removeRedundantZeros()')
      // If input contains a decimal point, it might be '.' or ',' - both are valid
      if (userInput.match(/^(0+(\.|,)\d+)$/g)) {
        //Only for decimal point input:
        //Exactly one leading zero must remain if it is placed directly before the decimal point (e.g. 000.12 -> 0.12)
        userInput = userInput.replace(/^(0+)/g, '0')
        console.log(`Case 1.1 - without leading zeros: /^(0+(\\.|,)\\d+)$/g`)
      }
      if (userInput.match(/^(0+\d+)/g)) {
        //e.g. 0012 -> 12 or 0012.12 -> 12.12
        userInput = userInput.replace(/^(0+)/g, '')
        console.log(`Case 1.2 - without leading zeros: /^(0+\\d+)/g `)
      }
      if (userInput.match(/(\.|,)/) && !userInput.match(/e/gi)) {
        //Only for decimal point input:
        //do not remove zeros in the end if the input is written in E-notation
        userInput = userInput.replace(/0+$|((\.|,)0+$)/, '')
        console.log(`Case 2 - without ending zeros after decimal point`)
      }
      return userInput
    },

    /**
     * Checks if a floating point input is formatted correctly.
     *
     * @param   {string} userInput  The input number
     * @return  {boolean} True if the input contains exactly one decimal separator - here both '.' and ','are treated
     *                    as valid. False if userInput contains more than one separator (thousand separators are not
     *                    permitted, i.e. having 100,000,000.1 the output would be NaN).
     */
    isValidFloatingPointInput(userInput) {
      console.log(`Enter isValidInputWithDecimalPoint()`)
      if (
        userInput.match(/\./g) !== null &&
        userInput.match(/\./g).length > 1
      ) {
        // more than one '.'
        this.output = 'NaN'
        return false
      }
      if (userInput.match(/,/g) !== null && userInput.match(/,/g).length > 1) {
        //more than one ','
        this.output = 'NaN'
        return false
      }
      if (userInput.match(/\./g) !== null && userInput.match(/,/g) !== null) {
        //at least one ',' and at least one '.'
        this.output = 'NaN'
        return false
      }
      return true
    },

    /**
     * If the input is a floating point number and contains a decimal comma, it is replaced by a decimal point, to
     * make the decimal separator valid for JS.
     *
     * @param   {string}  userInput The input number.
     * @return  {string}  userInput with decimal point separator or userInput as-is if it is an integer number.
     */
    replaceDecimalCommaByDecimalPoint(userInput) {
      console.log(`Enter replaceDecimalCommaByDecimalPoint()`)
      return userInput.indexOf(',') !== -1
        ? userInput.replace(',', '.')
        : userInput
    },

    /**
     * Converts floating point number into an object representing it in order to avoid floating point arithmetics.
     *
     * @param   {string}  inputStr  The input number:
     *                              (i.e. 1.11)
     * @return  {object}  An object of two properties representing inputStr. The first property {string} contains all
     *                    digits of inputStr (all characters except the decimal point). The second property {number}
     *                    is 10 raised to the n-th power, where n is the number of digits after the decimal point:
     *                              (i.e. { 111, 10^2 })
     *                    Integers are handled as well - no special case:
     *                              (i.e. 111 => { 111, 1 }).
     *
     * Goal: To avoid calculations with real numbers in higher lever functions, as in JS these could lead to fault
     * results: (i.e. 1.100000000004 instead of 1.1). To try using integers instead.
     */
    floatingPointNumberToObject(inputStr) {
      console.log(`Enter floatingPointNumberToObject()`)
      console.log(`inputStr ${inputStr}`)
      let decimalPointIndex = inputStr.indexOf('.')
      if (decimalPointIndex === -1) {
        // ---- if inputStr isn't a real number, return it as is; tenPow is then 1
        return {
          inputStrWithoutDecimalPoint: inputStr,
          tensPow: 1,
        }
      } else {
        return {
          inputStrWithoutDecimalPoint:
            inputStr.substring(0, decimalPointIndex) +
            inputStr.substring(decimalPointIndex + 1, inputStr.length), //---- the number string without the '.'
          tensPow: Math.pow(10, inputStr.length - decimalPointIndex - 1), //--- Math.pow(10, number of decimal places)
        }
      }
    },

    /**
     * Converts Exponential (e-Notation) Numbers to Decimals
     *
     * @param   {string} numIn  Number in exponent format (other formats returned as is).
     * @return  {string}  A decimal number string.
     *
     * Notes: No check is made for NaN or undefined inputs
     */
    exponentToLarge(numIn) {
      console.log('Enter exponentToLarge()')
      numIn += '' // To cater to numric entries
      let sign = '' // To remember the number sign
      numIn.charAt(0) == '-' && ((numIn = numIn.substring(1)), (sign = '-')) // remove - sign & remember it
      let str = numIn.split(/e/gi) // Split numeric string at 'e' or 'E'
      if (str.length < 2) return sign + numIn // Not an Exponent Number? Exit with orginal Num back
      let power = str[1] // Get Exponent (Power) (could be + or -)

      //if (power == 0 || power == -0) return sign + str[0] // If 0 exponents (i.e. 0|-0|+0) then that's an easy one

      let deciSp = (1.1).toLocaleString().substring(1, 2) // Get Deciaml Separator
      str = str[0].split(deciSp) // Split the Base Number into LH and RH at the decimal point
      let baseRH = str[1] || '', // RH Base part. Make sure we have a RH fraction else ""
        baseLH = str[0] // LH base part.

      if (power > 0) {
        // ------- Positive Exponents (Process the RH Base Part)
        if (power > baseRH.length) baseRH += '0'.repeat(power - baseRH.length) // Pad with "0" at RH
        baseRH = baseRH.slice(0, power) + deciSp + baseRH.slice(power) // Insert decSep at the correct place into RH base
        if (baseRH.charAt(baseRH.length - 1) == deciSp)
          baseRH = baseRH.slice(0, -1) // If decSep at RH end? => remove it
      } else {
        // ------- Negative Exponents (Process the LH Base Part)
        let num = Math.abs(power) - baseLH.length // Delta necessary 0's
        if (num > 0) baseLH = '0'.repeat(num) + baseLH // Pad with "0" at LH
        baseLH = baseLH.slice(0, power) + deciSp + baseLH.slice(power) // Insert "." at the correct place into LH base
        if (baseLH.charAt(0) == deciSp) baseLH = '0' + baseLH // If decSep at LH most? => add "0"
      }
      return sign + baseLH + baseRH // Return the long number (with sign)
    },

    /**
     * Formats the argument (input or output) by adding whitespaces as thousand separators.
     *
     * @param   {string or number} inputOrOutput  String when called for the input, and number when called for the
     *                                            output.
     * @return  {string}           The formatted inputOrOutput, e.g. 1000000 -> 1 000 000
     *
     * Notes: Should't be applied to the digits after the decimal point, if the argument is a floating point number.
     */
    insertWhiteSpaces(inputOrOutput) {
      console.log('Enter insertWhiteSpaces()')
      console.log(
        `type of parameter in insertWhiteSpaces: ${typeof inputOrOutput} `
      )
      let num_parts = inputOrOutput.toString().split('.')
      console.log(`splited parts: ${num_parts}`)
      num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      return num_parts.join('.')
    },

    /**
     * Converter for length and distance. Converts the user input from one selected unit to another. The arguments
     * represent the user input after it has been handled by floatingPointNumberToObject().
     *
     * @param {string} input   The input as a string containing all characters but the decimal point.
     * @param {number} tensPow 10 raised to the n-th power, where n is the number of digits after the decimal point.
     * @return {string} The output converted into the desired unit.
     *
     * Notes: First checks for input in E-notation and for floating point input and calls the respective functions.
     * Then the input is first converted to meter and the result is passed as an argument in the helper function
     * lengthConvFromMeter(): the conversion to the desired unit is calculated there.
     * Finally calls formatter function for the output which sets white spaces as thousand separators if necessary.
     */
    lengthConverter(input, tensPow) {
      console.log('')
      console.log('Enter lengthConverter()')
      console.log(
        `input: ${input}, tensPow: ${tensPow}, typeof input: ${typeof input}, typeof tensPow: ${typeof tensPow}`
      )
      if (this.toUnit === this.fromUnit) {
        console.log('this.toUnit===this.fromUnit')
        console.log(
          `this.output = input / tensPow: ${(this.output = input / tensPow)}`
        )
        this.output = input / tensPow // str -> int
        this.output = this.insertWhiteSpaces(this.output) // int -> str
        return
      }
      let inputInMeter = ''
      let tensPowMeter = 0
      let resultFloatingPointToObject = {}

      switch (this.fromUnit) {
        case 'nanometer (nm)':
          inputInMeter = (input / (Math.pow(10, 9) * tensPow)).toString()

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter:
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'micrometer / micron (μm)':
          inputInMeter = (input / (Math.pow(10, 6) * tensPow)).toString()

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'milimeter (mm)':
          inputInMeter = (input / (1000 * tensPow)).toString()

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'centimeter (cm)':
          inputInMeter = (input / (100 * tensPow)).toString()

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'decimeter (dm)':
          inputInMeter = (input / (10 * tensPow)).toString()

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'meter (m)':
          this.output = this.lengthConvFromMeter(input, tensPow)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'kilometer (km)':
          inputInMeter = ((input * 1000) / tensPow).toString()

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'inch (in)':
          inputInMeter = ((input * 254) / (10000 * tensPow)).toString() // 1 in = 0.0254 m

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'feet (ft)':
          inputInMeter = (
            (input * 3048) /
            (tensPow * Math.pow(10, 4))
          ).toString() // 1 ft = 0.3048 m
          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'yard (yd)':
          inputInMeter = (
            (input * 9144) /
            (tensPow * Math.pow(10, 4))
          ).toString() // 1 yd = 0.9144 m

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'mile (mi)':
          inputInMeter = (
            (input * 1609344) /
            (tensPow * Math.pow(10, 3))
          ).toString() // 1 mi = 1 609.344 m

          console.log(`Converted to meter (m)`)

          inputInMeter = this.exponentToLarge(inputInMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInMeter
          )
          inputInMeter = resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInMeter: ${inputInMeter}, tensPowMeter: 
            ${tensPowMeter}`
          )

          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        default:
          alert('Please choose units from the dropdown menus')
      }
    },

    /**
     * Helper function for lengthConverter(). Converts the user input from meter to the desired unit. The arguments
     * represent the user input after it has been handled by floatingPointNumberToObject().
     *
     * @param {string} inputInMeter   The input in meter as a string containing all characters but the decimal point.
     * @param {number} tensPow 10 raised to the n-th power, where n is the number of digits after the decimal point.
     * @return {string} The output converted into the desired unit.
     */
    lengthConvFromMeter(inputInMeter, tensPow) {
      /**
       * Floating point arithmetic:
       * GOAL: to have two integer operands at each step -> the brackets are put in a way that this is achieved:
       * multiplication always comes first, because it can not lead to a floating point result.
       * Division comes last:
       * integer / integer = correct result, even if the result is a real number.
       * However if one of the operands is a real number, the result might be faulty: e.g. 0.100000004 instead of 0.1
       */

      if (this.toUnit === 'nanometer (nm)') {
        console.log(`Convert to toUnit nanometer (nm)`)
        return (inputInMeter * Math.pow(10, 9)) / tensPow
      } else if (this.toUnit === 'micrometer / micron (μm)') {
        console.log(`Convert to toUnit micrometer / micron (μm)`)
        return (inputInMeter * Math.pow(10, 6)) / tensPow
      } else if (this.toUnit === 'milimeter (mm)') {
        console.log(`Convert to toUnit milimeter (mm)`)
        return (inputInMeter * 1000) / tensPow
      } else if (this.toUnit === 'centimeter (cm)') {
        console.log(`Convert to toUnit centimeter (cm)`)
        return (inputInMeter * 100) / tensPow
      } else if (this.toUnit === 'decimeter (dm)') {
        console.log(`Convert to toUnit decimeter (dm)`)
        return (inputInMeter * 10) / tensPow
      } else if (this.toUnit === 'kilometer (km)') {
        console.log(`Convert to toUnit kilometer (km)`)
        return inputInMeter / (1000 * tensPow)
      } else if (this.toUnit === 'inch (in)') {
        console.log(`Convert to toUnit inch (")`)
        return (inputInMeter * 3937007874015748) / (Math.pow(10, 14) * tensPow) // 1m = 39.37007874015748 in
      } else if (this.toUnit === 'feet (ft)') {
        console.log(`Convert to toUnit foot (ft)`)
        return (inputInMeter * 3280839895013123) / (Math.pow(10, 15) * tensPow) // 1m = 3.280839895013123 ft
      } else if (this.toUnit === 'yard (yd)') {
        console.log(`Convert to toUnit yard (yd)`)
        return (inputInMeter * 10936132983) / (Math.pow(10, 10) * tensPow) // 1m = 1.0936132983 yd
      } else if (this.toUnit === 'mile (mi)') {
        console.log(`Convert to toUnit mile (mi)`)
        return (inputInMeter * 62137119223733) / (Math.pow(10, 17) * tensPow) // 1m =  0.0062137119223733 mi
      } else {
        // if (this.toUnit == 'meter (m)')
        console.log(`Convert to toUnit meter (m)`)
        return inputInMeter / tensPow
      }
    },

    /**
     * Converter for volume. Converts the user input from one selected unit to another. The arguments
     * represent the user input after it has been handled by floatingPointNumberToObject().
     *
     * @param {string} input   The input as a string containing all characters but the decimal point.
     * @param {number} tensPow 10 raised to the n-th power, where n is the number of digits after the decimal point.
     * @return {string} The output converted into the desired unit.
     *
     * Notes: First checks for input in E-notation and for floating point input and calls the respective functions.
     * Then the input is first converted to cubic meter and the result is passed as an argument in the helper function
     * volumeConvFromCubicMeter(): the conversion to the desired unit is calculated there.
     * Finally calls formatter function for the output which sets white spaces as thousand separators if necessary.
     */
    volumeConverter(input, tensPow) {
      console.log('')
      console.log('Enter volumeConverter()')
      console.log(
        `input: ${input}, tensPow: ${tensPow}, typeof input: ${typeof input}, typeof tensPow: ${typeof tensPow}`
      )
      if (this.toUnit === this.fromUnit) {
        console.log('this.toUnit === this.fromUnit')
        console.log(
          `this.output = input / tensPow: ${(this.output = input / tensPow)}`
        )
        this.output = input / tensPow //str -> int
        this.output = this.insertWhiteSpaces(this.output) // int -> str
        return
      }
      let inputInCubicMeter = ''
      let tensPowCubicMeter = 0
      let resultFloatingPointToObject = {}
      switch (this.fromUnit) {
        case 'cubic milimeter':
          inputInCubicMeter = (input / (Math.pow(10, 9) * tensPow)).toString()

          console.log(`Converted to cubic meter`)

          inputInCubicMeter = this.exponentToLarge(inputInCubicMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInCubicMeter
          )
          inputInCubicMeter =
            resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowCubicMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInCubicMeter: ${inputInCubicMeter}, 
            tensPowCubicMeter: ${tensPowCubicMeter}`
          )

          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'cubic centimeter':
          inputInCubicMeter = (input / (Math.pow(10, 6) * tensPow)).toString()

          console.log(`Converted to cubic meter`)

          inputInCubicMeter = this.exponentToLarge(inputInCubicMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInCubicMeter
          )
          inputInCubicMeter =
            resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowCubicMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInCubicMeter: ${inputInCubicMeter}, 
            tensPowCubicMeter: ${tensPowCubicMeter}`
          )

          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'cubic decimeter':
          inputInCubicMeter = (input / (1000 * tensPow)).toString()

          console.log(`Converted to cubic meter`)

          inputInCubicMeter = this.exponentToLarge(inputInCubicMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInCubicMeter
          )
          inputInCubicMeter =
            resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowCubicMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInCubicMeter: ${inputInCubicMeter}, 
            tensPowCubicMeter: ${tensPowCubicMeter}`
          )

          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'cubic meter':
          this.output = this.volumeConvFromCubicMeter(input, tensPow)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'cubic kilometer':
          inputInCubicMeter = ((input * Math.pow(10, 9)) / tensPow).toString()

          console.log(`Converted to cubic meter`)

          inputInCubicMeter = this.exponentToLarge(inputInCubicMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInCubicMeter
          )
          inputInCubicMeter =
            resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowCubicMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInCubicMeter: ${inputInCubicMeter}, 
            tensPowCubicMeter: ${tensPowCubicMeter}`
          )

          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'mililiter':
          inputInCubicMeter = (input / (Math.pow(10, 6) * tensPow)).toString()

          console.log(`Converted to cubic meter`)

          inputInCubicMeter = this.exponentToLarge(inputInCubicMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInCubicMeter
          )
          inputInCubicMeter =
            resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowCubicMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInCubicMeter: ${inputInCubicMeter}, 
            tensPowCubicMeter: ${tensPowCubicMeter}`
          )

          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'liter':
          inputInCubicMeter = (input / (1000 * tensPow)).toString()

          console.log(`Converted to cubic meter`)

          inputInCubicMeter = this.exponentToLarge(inputInCubicMeter)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInCubicMeter
          )
          inputInCubicMeter =
            resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowCubicMeter = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInCubicMeter: ${inputInCubicMeter}, 
            tensPowCubicMeter: ${tensPowCubicMeter}`
          )

          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        default:
          alert('Please choose units from the dropdown menus')
      }
    },

    /**
     * Helper function for volumeConverter(). Converts the user input from cubic meter to the desired unit. The
     * arguments represent the user input after it has been handled by floatingPointNumberToObject().
     *
     * @param {string} inputInMeter   The input in meter as a string containing all characters but the decimal point.
     * @param {number} tensPow 10 raised to the n-th power, where n is the number of digits after the decimal point.
     * @return {string} The output converted into the desired unit.
     */
    volumeConvFromCubicMeter(inputInCubicMeter, tensPow) {
      /**
       * Floating point arithmetic:
       * GOAL: to have two integer operands at each step -> the brackets are put in a way that this is achieved:
       * multiplication always comes first, because it can not lead to a floating point result.
       * Division comes last:
       * integer / integer = correct result, even if the result is a real number.
       * However if one of the operands is a real number, the result might be faulty: e.g. 0.100000004 instead of 0.1
       */

      if (this.toUnit === 'cubic milimeter') {
        console.log(`Convert to toUnit cubic milimeter`)
        return (inputInCubicMeter * Math.pow(10, 9)) / tensPow
      } else if (this.toUnit === 'cubic centimeter') {
        console.log(`Convert to toUnit cubic centimeter`)
        return (inputInCubicMeter * Math.pow(10, 6)) / tensPow
      } else if (this.toUnit === 'cubic decimeter') {
        console.log(`Convert to toUnit cubic decimeter`)
        return (inputInCubicMeter * 1000) / tensPow
      } else if (this.toUnit === 'cubic kilometer') {
        console.log(`Convert to toUnit cubic kilometer`)
        return inputInCubicMeter / (Math.pow(10, 9) * tensPow)
      } else if (this.toUnit === 'mililiter') {
        console.log(`Convert to toUnit mililiter`)
        return (inputInCubicMeter * Math.pow(10, 6)) / tensPow
      } else if (this.toUnit === 'liter') {
        console.log(`Convert to toUnit liter`)
        return (inputInCubicMeter * 1000) / tensPow
      } else {
        // if (this.toUnit == 'cubic meter')
        console.log(`Convert to toUnit cubic meter`)
        return inputInCubicMeter / tensPow
      }
    },

    /**
     * Converter for temperature. Converts the user input from one selected unit to another. The arguments
     * represent the user input after it has been handled by floatingPointNumberToObject().
     *
     * @param {string} input   The input as a string containing all characters but the decimal point.
     * @param {number} tensPow 10 raised to the n-th power, where n is the number of digits after the decimal point.
     * @return {string} The output converted into the desired unit.
     *
     * Notes: First checks for input in E-notation and for floating point input and calls the respective functions.
     * Then the input is first converted to Celsius and the result is passed as an argument in the helper function
     * temperatureConvFromCelsius(): the conversion to the desired unit is calculated there.
     * Finally calls formatter function for the output which sets white spaces as thousand separators if necessary.
     */
    temperatureConverter(input, tensPow) {
      console.log('')
      console.log('Enter temperatureConverter()')
      console.log(
        `input: ${input}, tensPow: ${tensPow}, typeof input: ${typeof input}, typeof tensPow: ${typeof tensPow}`
      )
      if (this.toUnit === this.fromUnit) {
        console.log('this.toUnit === this.fromUnit')
        console.log(
          `this.output = input / tensPow: ${(this.output = input / tensPow)}`
        )
        this.output = input / tensPow // str -> int
        this.output = this.insertWhiteSpaces(this.output) // int -> str
        return
      }
      let inputInCelsius = ''
      let tensPowCelsius = 0
      let resultFloatingPointToObject = {}
      switch (this.fromUnit) {
        /**
         * Floating point arithmetics in all cases:
         * In some of the formulas floating point number operands cannot be avoided due to addition or subtraction,
         * which are not commutative with mult and div.
         * Therefore the result might not be quite exact. It is displayed with precision up to 12 decimal places with
         * toFixed(12), and then converted to number with the '+' operator.
         * This is only applied to the final result at the last step after the helper function is called.
         */
        case 'Fahrenheit (°F)':
          inputInCelsius = (((input / tensPow - 32) * 5) / 9).toString() // °C = (°F − 32) × 5/9

          console.log(`Converted to celsius`)

          inputInCelsius = this.exponentToLarge(inputInCelsius)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInCelsius
          )
          inputInCelsius =
            resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowCelsius = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInCelsius: ${inputInCelsius}, tensPowCelsius: 
            ${tensPowCelsius}`
          )

          this.output = this.temperatureConvFromCelsius(
            inputInCelsius,
            tensPowCelsius
          )
          this.output = this.insertWhiteSpaces(+this.output.toFixed(12))
          break
        case 'Kelvin (K)':
          inputInCelsius = (input / tensPow - 273.15).toString()

          console.log(`Converted to celsius`)

          console.log('LOOK HERE' + (parseFloat(input) - 273.15) / tensPow)
          inputInCelsius = this.exponentToLarge(inputInCelsius)
          resultFloatingPointToObject = this.floatingPointNumberToObject(
            inputInCelsius
          )
          inputInCelsius =
            resultFloatingPointToObject.inputStrWithoutDecimalPoint
          tensPowCelsius = resultFloatingPointToObject.tensPow

          console.log(
            `SECOND result from floatingPointNumberToObject is inputInCelsius: 
            ${inputInCelsius}, tensPowCelsius: ${tensPowCelsius}`
          )

          this.output = this.temperatureConvFromCelsius(
            inputInCelsius,
            tensPowCelsius
          )
          this.output = this.insertWhiteSpaces(+this.output.toFixed(12))
          break
        case 'Celsius (°C)':
          this.output = this.temperatureConvFromCelsius(input, tensPow)
          this.output = this.insertWhiteSpaces(this.output)
          break
        default:
          alert('Please choose units from the dropdown menus')
      }
    },

    /**
     * Helper function for temperatureConverter(). Converts the user input from cubic meter to the desired unit. The
     * arguments represent the user input after it has been handled by floatingPointNumberToObject().
     *
     * @param {string} inputInMeter   The input in meter as a string containing all characters but the decimal point.
     * @param {number} tensPow 10 raised to the n-th power, where n is the number of digits after the decimal point.
     * @return {string} The output converted into the desired unit.
     */
    temperatureConvFromCelsius(inputInCelsius, tensPow) {
      console.log('Enter temperatureConvFromCelsius')
      if (this.toUnit === 'Fahrenheit (°F)') {
        console.log(`Convert to toUnit Fahrenheit (°F)`)
        return (inputInCelsius / tensPow) * 1.8 + 32 // °F = °C * 9 / 5 + 32
      } else if (this.toUnit === 'Kelvin (K)') {
        console.log(`Convert to toUnit Kelvin (K)`)
        return inputInCelsius / tensPow + 273 + 0.15 // °K = °C + 273.15
      } else {
        // if (this.toUnit == 'Celsius (°C)')
        console.log(`Convert to toUnit Celsius (°C)`)
        return inputInCelsius / tensPow
      }
    },

    /**
     * All functions are called from here.
     */
    main() {
      /** Calculations will not be perfomed directly on this.input, but on let input instead.
       * this.input will only be formatted so that it looks better and easier to read.
       */
      console.log(``)
      console.log('Enter main()')
      console.log('typeof this.input is ' + typeof this.input)
      console.log('typeof this.output is ' + typeof this.output)

      this.input = this.removeWhiteSpaces(this.input)
      this.input = this.removeRedundantZeros(this.input)
      let input = this.input
      let tensPow = 1

      // Following if-statement handles floating point input:
      if (this.input.indexOf(',') !== -1 || this.input.indexOf('.') !== -1) {
        let isValid = this.isValidFloatingPointInput(this.input)
        console.log(`isValidFloatingPointInput: ${isValid}`)
        if (!isValid) {
          return
        } else {
          this.input = this.replaceDecimalCommaByDecimalPoint(this.input)
          console.log(
            `replaceDecimalCommaByDecimalPoint: this.input: ${this.input}`
          )
        }
        input = this.input
        input = this.exponentToLarge(input)
        const resultFloatingPointToObject = this.floatingPointNumberToObject(
          input
        )
        input = resultFloatingPointToObject.inputStrWithoutDecimalPoint
        tensPow = resultFloatingPointToObject.tensPow
        console.log(
          `result from floatingPointNumberToObject is input: ${input}, tensPow: ${tensPow}`
        )
      }

      this.input = this.insertWhiteSpaces(this.input)
      if (this.unit.id === 'length') {
        this.lengthConverter(input, tensPow)
      } else if (this.unit.id === 'volume') {
        this.volumeConverter(input, tensPow)
      } else if (this.unit.id === 'temperature') {
        this.temperatureConverter(input, tensPow)
      } else {
        console.log('unit error')
      }
    },
  },
  created() {
    ConverterService.getUnit(this.unit_name)
      .then((response) => {
        this.unit = response.data
      })
      .catch((error) => {
        console.log('There was an error: ' + error.response)
      })
  },
}
</script>

<style lang="scss" scoped>
.converter {
  background: #000;
}
.converter > h1 {
  color: var(--custom-green);
  background: #000;
  font-size: 2.5rem;
  font-weight: 100;
}
.container {
  width: 80%;
  margin: 0 auto;
  padding: 25vh 0;
  display: grid;
  grid-template-columns: 5fr minmax(75px, 1fr) 5fr;
  grid-gap: 5%;
  justify-content: center;
  position: relative;
}
.container-selection {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(249px, 1fr);
}
input,
select,
option {
  color: var(--custom-green);
  padding-left: 5%;
  line-height: 3rem;
  border: none;
}
input {
  font-size: 1.5rem;
  border-bottom: 1px solid var(--custom-green);
  text-align: center;
  background: #000;
}
select,
option {
  font-size: 1.2rem;
  border: 1px solid var(--custom-gray-light);
}
button {
  font-size: 1rem;
  background: var(--custom-green);
  color: var(--custom-white);
  border-right: 1px solid var(--custom-green);
  border-radius: 0.5rem;
  transition: 0.5s ease;

  &:hover {
    border-radius: 0rem;
    border: 1px dashed var(--custom-white);
  }
}
/* ENTITY INDIVIDUAL STYLING: LENGTH */
.length {
  background-image: url('../assets/length.png');
  background-size: cover;
  background-position: center;
  -webkit-animation-name: length2;
  animation-name: length2;
  -webkit-animation-duration: 2s;
  animation-duration: 2s;
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
}
@-webkit-keyframes length2 {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes length2 {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@media screen and (max-width: 578px) {
  .length {
    background-size: contain;
  }
}
/* ENTITY INDIVIDUAL STYLING: VOLUME */
.volume {
  background-image: url('../assets/volume.png');
  background-size: contain;
  background-position: top;
  background-attachment: fixed;
  animation-name: volume7;
  -webkit-animation-name: volume7;
  -webkit-animation-duration: 2.5s;
  animation-duration: 2.5s;
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
}

@-webkit-keyframes volume7 {
  0% {
    background-position: unset;
    opacity: 0;
  }
  50% {
    background-position: top;
  }
  100% {
    background-position: top;
    opacity: 1;
  }
}
@keyframes volume1 {
  0% {
    background-position: unset;
    opacity: 0;
  }
  50% {
    background-position: top;
  }
  100% {
    background-position: top;
    opacity: 1;
  }
}
/* ENTITY INDIVIDUAL STYLING: TEMPERATURE */
.temperature {
  background-image: url('../assets/temperature.png');
  background-attachment: fixed;
  background-size: cover;
  background-position: inherit;
  animation-name: temperature1;
  -webkit-animation-name: temperature1;
  -webkit-animation-duration: 2.5s;
  animation-duration: 2.5s;
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
  h1 {
    color: var(--custom-yellow) !important;
  }
  button {
    background: var(--custom-yellow) !important;
  }
  input {
    border-bottom: none !important;
  }
  input,
  select,
  option {
    color: var(--custom-yellow) !important;
  }
  select,
  option {
    border: 1px dotted #dcd68a !important;
    border-right: none !important;
    background: #000;
  }
}
@-webkit-keyframes temperature1 {
  0% {
    background-position: bottom;
    opacity: 0;
  }
  50% {
    background-position: inherit;
  }
  100% {
    background-position: inherit;
    opacity: 1;
  }
}
@keyframes length1 {
  0% {
    background-position: bottom;
    opacity: 0;
  }
  50% {
    background-position: inherit;
  }
  100% {
    background-position: inherit;
    opacity: 1;
  }
}
@media screen and (max-width: 767px) {
  .container {
    padding: 20vh 0;
    grid-template-columns: auto;
    button {
      margin: 5% auto;
      width: 70px;
      height: 70px;
    }
  }
}
</style>

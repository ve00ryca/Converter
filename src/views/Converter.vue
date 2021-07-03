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
      unit: {}, //just a single unit based on the unit_name
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
    /**********************************************************
     * Removes all white spaces from the input number
     **********************************************************
     * @function removeWhiteSpaces()
     * @param   {string}  The user input number
     * @return  {string}  Returns the input without white spaces
     *********************************************************/
    removeWhiteSpaces(userInput) {
      console.log('Enter removeWhiteSpaces()')
      console.log(`without whitespaces: ${userInput.replace(/\s/g, '')}`)
      return userInput.replace(/\s/g, '')
    },
    /***********************************************************
     * Removes all reduntant zeros from the input if any
     ***********************************************************
     * @function removeRedundantZeros()
     * @param   {string}  The user input number
     * @return  {string}  Returns the input without redundant
     *                    leading zeros and without zeros at the
     *                    end (if the input is a decimal number)
     **********************************************************/
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
    /**********************************************************************************
     * Checks if the input contains more than one decimal points or thousand separators
     **********************************************************************************
     * @function isValidDecimalPointInput()
     * @param   {string}  The input number
     * @return  {boolean} Returns true if the input contains exactly one '.' or ','
     *                    character - in both cases the input is treated as a valid
     *                    floating point number
     *
     * Notes: The input isn't supposed to be formatted by the user: in a way that it
     * contains more than one comma or dot, i.e. 100,000,000.1. If that is the case,
     * then the output would be NaN.
     *
     *********************************************************************************/
    isValidDecimalPointInput(userInput) {
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
    /****************************************************************************************
     * If the input is a floating point number and contains an ','- character, it is replaced
     * by a '.', so than the input becomes a valid number for JS
     ****************************************************************************************
     * @function replaceCommaByDecimalPoint()
     * @param   {string}  The input number
     * @return  {string}  Returns a real number input with an '.' instead of an ',' as
     *                    floating point character.
     ***************************************************************************************/
    replaceCommaByDecimalPoint(userInput) {
      console.log(`Enter replaceCommaByDecimalPoint()`)
      return userInput.indexOf(',') !== -1
        ? userInput.replace(',', '.')
        : userInput
    },
    /****************************************************************************************
     * Converts the input number into an object representing the number
     ****************************************************************************************
     * @function hanleInputWithDecimalPoint()
     * @param   {string}  Input number (i.e. 1.11)
     * @return  {object}  Returns an object representing the input number (i.e. { 111, 10^2 }).
     *                    Decimal number inputs are handled as well, i.e. 111 => {111, 1}
     *
     * Goal: Avoid calculations with real numbers in further methods, as these could lead to
     * fault results (i.e. output = 1.100000000004 instead of 1.1). Use decimal number
     * arithmetics instead.
     *
     ***************************************************************************************/
    hanleInputWithDecimalPoint(inputStr) {
      console.log(`Enter hanleInputWithDecimalPoint()`)
      console.log(`inputStr ${inputStr}`)
      let decimalPointIndex = inputStr.indexOf('.')
      if (decimalPointIndex === -1) {
        // ---- input isn't a real number, return it as is; tenPow is then 1
        return {
          inputStrWithoutDecimalPoint: inputStr,
          tensPow: 1,
        }
      } else {
        return {
          inputStrWithoutDecimalPoint:
            inputStr.substring(0, decimalPointIndex) +
            inputStr.substring(decimalPointIndex + 1, inputStr.length), // the Number string without the '.'
          tensPow: Math.pow(10, inputStr.length - decimalPointIndex - 1), // Math.pow(10, number of decimal places)
        }
      }
    },
    /********************************************************
     * Converts Exponential (e-Notation) Numbers to Decimals
     ********************************************************
     * @function numberExponentToLarge()
     * @version  1.00
     * @param   {string}  Number in exponent format.
     *                   (other formats returned as is).
     * @return  {string}  Returns a decimal number string.
     * @author  Mohsen Alyafei
     * @date    12 Jan 2020
     *
     * Notes: No check is made for NaN or undefined inputs
     *
     *******************************************************/
    numberExponentToLarge(numIn) {
      numIn += '' // To cater to numric entries
      let sign = '' // To remember the number sign
      numIn.charAt(0) == '-' && ((numIn = numIn.substring(1)), (sign = '-')) // remove - sign & remember it
      let str = numIn.split(/e/gi) // Split numberic string at e or E
      if (str.length < 2) return sign + numIn // Not an Exponent Number? Exit with orginal Num back
      let power = str[1] // Get Exponent (Power) (could be + or -)
      if (power == 0 || power == -0) return sign + str[0] // If 0 exponents (i.e. 0|-0|+0) then that's an easy one

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
    /****************************************************************************************
     * Formats the argument (input or output) by adding whitespaces
     ****************************************************************************************
     * @function insertWhiteSpaces()
     * @param   {string or number}  The argument is a string when called for the input, and
     *                              a number when called for the output.
     * @return  {string}            Returns the formatted argument, e.g. 1000000 -> 1 000 000
     *
     * Notes: If the argument is a real number, the digits after the decimal point are not
     * being formatted.
     *
     ***************************************************************************************/
    /* TODO edit the callers */
    insertWhiteSpaces(toInputOrOutput) {
      console.log('Enter insertWhiteSpaces()')
      console.log(
        `type of parameter in insertWhiteSpaces: ${typeof toInputOrOutput} `
      )
      let num_parts = toInputOrOutput.toString().split('.')
      console.log(`splited parts: ${num_parts}`)
      num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      return num_parts.join('.')
    },
    /* caller: main() */
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
        this.output = input / tensPow //str->int
        this.output = this.insertWhiteSpaces(this.output) //int->str
        return
      }
      let inputInMeter = ''
      let tensPowMeter = 0
      let handleResult = {}
      switch (this.fromUnit) {
        case 'nanometer (nm)':
          //step 1: convert to meter (m) first
          inputInMeter = (
            input /
            (Math.pow(10, 9) * tensPow)
          ).toString() /* /10^9=>*tensPow */
          console.log(`Converted to meter (m)`)

          inputInMeter = this.numberExponentToLarge(inputInMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'micrometer / micron (μm)':
          //step 1: convert to meter (m) first
          inputInMeter = (
            input /
            (Math.pow(10, 6) * tensPow)
          ).toString() /* /10^6=>*tensPow */
          console.log(`Converted to meter (m)`)

          inputInMeter = this.numberExponentToLarge(inputInMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'milimeter (mm)':
          //step 1: convert to meter (m) first
          inputInMeter = (
            input /
            (1000 * tensPow)
          ).toString() /* /10^3=>*tensPow */
          console.log(`Converted to meter (m)`)
          inputInMeter = this.numberExponentToLarge(inputInMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'centimeter (cm)':
          //step 1: convert to meter (m) first
          inputInMeter = (
            input /
            (100 * tensPow)
          ).toString() /* /10^2=>*tensPow */
          console.log(`Converted to meter (m)`)
          inputInMeter = this.numberExponentToLarge(inputInMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'decimeter (dm)':
          //step 1: convert to meter (m) first
          inputInMeter = (
            input /
            (10 * tensPow)
          ).toString() /* /10^2=>*tensPow */
          console.log(`Converted to meter (m)`)
          inputInMeter = this.numberExponentToLarge(inputInMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'meter (m)':
          //step 1: convert to meter (m) first: not needed here
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter) after conversion in meter: already done in main()-not needed here
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(input, tensPow)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'kilometer (km)':
          //step 1: convert to meter (m) first
          inputInMeter = (
            (input * 1000) /
            tensPow
          ).toString() /* *10^3=>/tensPow */
          console.log(`Converted to meter (m)`)
          inputInMeter = this.numberExponentToLarge(inputInMeter)

          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'inch (in)':
          //step 1: convert to meter (m) first
          inputInMeter = (
            (input * 254) /
            (10000 * tensPow)
          ).toString() /* 0.0254 m in an inch */
          console.log(`Converted to meter (m)`)
          inputInMeter = this.numberExponentToLarge(inputInMeter)

          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'feet (ft)':
          //step 1: convert to meter (m) first (inputInMeter * 328084) / (Math.pow(10, 5) * tensPow)
          inputInMeter = (
            (input * tensPow) /
            (328084 / Math.pow(10, 5))
          ).toString() /* 0.0254 m in an inch */
          console.log(`Converted to meter (m)`)
          inputInMeter = this.numberExponentToLarge(inputInMeter)

          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'yard (yd)':
          //step 1: convert to meter (m) first (inputInMeter * 328084) / (Math.pow(10, 5) * tensPow)
          inputInMeter = (
            (input / tensPow) *
            0.9144
          ).toString() /* 0.0254 m in an inch */
          console.log(`Converted to meter (m)`)
          inputInMeter = this.numberExponentToLarge(inputInMeter)

          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'mile (mi)':
          //step 1: convert to meter (m) first (inputInMeter * 328084) / (Math.pow(10, 5) * tensPow)
          inputInMeter = ((input / tensPow) * 1609.35).toString() /* */
          console.log(`Converted to meter (m)`)
          inputInMeter = this.numberExponentToLarge(inputInMeter)

          //step 2: avoid calculations with decimal point operands in step 3 - if inputInMeter has decimal point, call the function handleInputWithDecimalPoint(inputInMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInMeter)
          inputInMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInMeter: ${inputInMeter}, tensPowMeter: ${tensPowMeter}`
          )
          //step 3: convert from meter (m) to the desired unit and then format the output
          this.output = this.lengthConvFromMeter(inputInMeter, tensPowMeter)
          this.output = this.insertWhiteSpaces(this.output)
          break
        default:
          alert('Please choose units from the dropdown menus')
      }
    },
    lengthConvFromMeter(inputInMeter, tensPow) {
      //ako v skobite ima delenie, i se polu4i decimal point (t.e. 10^x < tensPow), resultatut e greshen.
      //GOAL: two operands, both of which have to be a whole number => the brackets are put in a way that this is always achieved
      //multiplication always comes first, because it can not lead to a decimal point result.
      //cqlo 4islo / cqlo 4islo = veren rezulatat, dori i da sudurja decimal point
      //ako edno ot delimite sudurja decimal point, rezultatut s decimal point shte e greshen, e.g. 0.100000004 vmesto 0.1

      if (this.toUnit === 'nanometer (nm)') {
        console.log(`Convert to toUnit nanometer (nm)`)
        return (inputInMeter * Math.pow(10, 9)) / tensPow // *=> 10^9 / tensPow
      } else if (this.toUnit === 'micrometer / micron (μm)') {
        console.log(`Convert to toUnit micrometer / micron (μm)`)
        return (inputInMeter * Math.pow(10, 6)) / tensPow // *=> 10^6 / tensPow
      } else if (this.toUnit === 'milimeter (mm)') {
        console.log(`Convert to toUnit milimeter (mm)`)
        return (inputInMeter * 1000) / tensPow // *=> 10^3 / tensPow
      } else if (this.toUnit === 'centimeter (cm)') {
        console.log(`Convert to toUnit centimeter (cm)`)
        return (inputInMeter * 100) / tensPow // *=> 10^2 / tensPow
      } else if (this.toUnit === 'decimeter (dm)') {
        console.log(`Convert to toUnit decimeter (dm)`)
        return (inputInMeter * 10) / tensPow // *=> 10^1 / tensPow
      } else if (this.toUnit === 'kilometer (km)') {
        console.log(`Convert to toUnit kilometer (km)`)
        return inputInMeter / (1000 * tensPow)
      } else if (this.toUnit === 'inch (in)') {
        console.log(`Convert to toUnit inch (\")`)
        return (inputInMeter * 39370078740157) / (Math.pow(10, 12) * tensPow) // 1m = 39.370078740157 inch 3.28084
      } else if (this.toUnit === 'feet (ft)') {
        console.log(`Convert to toUnit foot (ft)`)
        return (inputInMeter * 328084) / (Math.pow(10, 5) * tensPow) // 1m = 3.28084 ft
      } else if (this.toUnit === 'yard (yd)') {
        console.log(`Convert to toUnit yard (yd)`)
        return (inputInMeter * 1.0936132983) / tensPow // 1m = 1.0936132983 yd
      } else if (this.toUnit === 'mile (mi)') {
        console.log(`Convert to toUnit mile (mi)`)
        return (inputInMeter * 0.0006213689) / tensPow // 1m = 1.0936132983 mi
      } else {
        // if (this.toUnit == 'meter (m)')
        console.log(`Convert to toUnit meter (m)`)
        return inputInMeter / tensPow
      }
    },
    volumeConverter(input, tensPow) {
      console.log('')
      console.log('Enter volumeConverter()')
      console.log(
        `input: ${input}, tensPow: ${tensPow}, typeof input: ${typeof input}, typeof tensPow: ${typeof tensPow}`
      )
      if (this.toUnit === this.fromUnit) {
        console.log('this.toUnit===this.fromUnit')
        console.log(
          `this.output = input / tensPow: ${(this.output = input / tensPow)}`
        )
        this.output = input / tensPow //str->int
        this.output = this.insertWhiteSpaces(this.output) //int->str
        return
      }
      let inputInCubicMeter = ''
      let tensPowCubicMeter = 0
      let handleResult = {}
      switch (this.fromUnit) {
        case 'cubic milimeter':
          //step 1: convert to cubic meter first
          inputInCubicMeter = (
            input /
            (Math.pow(10, 9) * tensPow)
          ).toString() /* /10^3=>*tensPow */
          console.log(`Converted to cubic meter`)

          inputInCubicMeter = this.numberExponentToLarge(inputInCubicMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCubicMeter has decimal point, call the function handleInputWithDecimalPoint(inputInCubicMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInCubicMeter)
          inputInCubicMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowCubicMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInCubicMeter: ${inputInCubicMeter}, tensPowCubicMeter: ${tensPowCubicMeter}`
          )
          //step 3: convert from cubic meter to the desired unit and then format the output
          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'cubic centimeter':
          //step 1: convert to cubic meter first   (inputInCubicMeter * Math.pow(10, 6)) / tensPow
          inputInCubicMeter = (
            input /
            (Math.pow(10, 6) * tensPow)
          ).toString() /* /10^3=>*tensPow */
          console.log(`Converted to cubic meter`)
          inputInCubicMeter = this.numberExponentToLarge(inputInCubicMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCubicMeter has decimal point, call the function handleInputWithDecimalPoint(inputInCubicMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInCubicMeter)
          inputInCubicMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowCubicMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInCubicMeter: ${inputInCubicMeter}, tensPowCubicMeter: ${tensPowCubicMeter}`
          )
          //step 3: convert from cubic meter to the desired unit and then format the output
          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'cubic decimeter':
          //step 1: convert to cubic meter first   (inputInCubicMeter * Math.pow(10, 6)) / tensPow
          inputInCubicMeter = (
            input /
            (1000 * tensPow)
          ).toString() /* /10^3=>*tensPow */
          console.log(`Converted to cubic meter`)
          inputInCubicMeter = this.numberExponentToLarge(inputInCubicMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCubicMeter has decimal point, call the function handleInputWithDecimalPoint(inputInCubicMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInCubicMeter)
          inputInCubicMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowCubicMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInCubicMeter: ${inputInCubicMeter}, tensPowCubicMeter: ${tensPowCubicMeter}`
          )
          //step 3: convert from cubic meter to the desired unit and then format the output
          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'cubic meter':
          //step 1: convert to cubic meter first: not needed here
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCubicMeter has decimal point, call the function handleInputWithDecimalPoint(inputInCubicMeter) after conversion in meter: already done in main()-not needed here
          //step 3: convert from cubic meter to the desired unit and then format the output
          this.output = this.volumeConvFromCubicMeter(input, tensPow)
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'cubic kilometer':
          //step 1: convert to cubic meter first
          inputInCubicMeter = (
            (input * Math.pow(10, 9)) /
            tensPow
          ).toString() /* *10^3=>/tensPow */
          console.log(`Converted to cubic meter`)
          inputInCubicMeter = this.numberExponentToLarge(inputInCubicMeter)

          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCubicMeter has decimal point, call the function handleInputWithDecimalPoint(inputInCubicMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInCubicMeter)
          inputInCubicMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowCubicMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInCubicMeter: ${inputInCubicMeter}, tensPowCubicMeter: ${tensPowCubicMeter}`
          )
          //step 3: convert from cubic meter to the desired unit and then format the output
          this.output = this.lengthConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'mililiter':
          //step 1: convert to cubic meter first (inputInCubicMeter * Math.pow(10, 6)) / tensPow
          inputInCubicMeter = (
            input /
            (Math.pow(10, 6) * tensPow)
          ).toString() /* /10^2=>*tensPow */
          console.log(`Converted to cubic meter`)
          inputInCubicMeter = this.numberExponentToLarge(inputInCubicMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCubicMeter has decimal point, call the function handleInputWithDecimalPoint(inputInCubicMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInCubicMeter)
          inputInCubicMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowCubicMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInCubicMeter: ${inputInCubicMeter}, tensPowCubicMeter: ${tensPowCubicMeter}`
          )
          //step 3: convert from cubic meter to the desired unit and then format the output
          this.output = this.volumeConvFromCubicMeter(
            inputInCubicMeter,
            tensPowCubicMeter
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'liter':
          //step 1: convert to cubic meter first
          inputInCubicMeter = (
            input /
            (1000 * tensPow)
          ).toString() /* /10^2=>*tensPow */
          console.log(`Converted to cubic meter`)
          inputInCubicMeter = this.numberExponentToLarge(inputInCubicMeter)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCubicMeter has decimal point, call the function handleInputWithDecimalPoint(inputInCubicMeter)
          handleResult = this.hanleInputWithDecimalPoint(inputInCubicMeter)
          inputInCubicMeter = handleResult.inputStrWithoutDecimalPoint
          tensPowCubicMeter = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInCubicMeter: ${inputInCubicMeter}, tensPowCubicMeter: ${tensPowCubicMeter}`
          )
          //step 3: convert from cubic meter to the desired unit and then format the output
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
    volumeConvFromCubicMeter(inputInCubicMeter, tensPow) {
      //ako v skobite ima delenie, i se polu4i decimal point (t.e. 10^x < tensPow), resultatut e greshen.
      //GOAL: two operands, both of which have to be a whole number => the brackets are put in a way that this is always achieved
      //multiplication always comes first, because it can not lead to a decimal point result.
      //cqlo 4islo / cqlo 4islo = veren rezulatat, dori i da sudurja decimal point
      //ako edno ot delimite sudurja decimal point, rezultatut s decimal point shte e greshen, e.g. 0.100000004 vmesto 0.1

      if (this.toUnit === 'cubic milimeter') {
        console.log(`Convert to toUnit cubic milimeter`)
        return (inputInCubicMeter * Math.pow(10, 9)) / tensPow // *=> 10^9 / tensPow
      } else if (this.toUnit === 'cubic centimeter') {
        console.log(`Convert to toUnit cubic centimeter`)
        return (inputInCubicMeter * Math.pow(10, 6)) / tensPow // *=> 10^6 / tensPow
      } else if (this.toUnit === 'cubic decimeter') {
        console.log(`Convert to toUnit cubic decimeter`)
        return (inputInCubicMeter * 1000) / tensPow // /=> 10^3 * tensPow
      } else if (this.toUnit === 'cubic kilometer') {
        console.log(`Convert to toUnit cubic kilometer`)
        return inputInCubicMeter / (Math.pow(10, 9) * tensPow) // *=> 10^9 / tensPow
      } else if (this.toUnit === 'mililiter') {
        console.log(`Convert to toUnit mililiter`)
        return (inputInCubicMeter * Math.pow(10, 6)) / tensPow // /=> 10^6 * tensPow
      } else if (this.toUnit === 'liter') {
        console.log(`Convert to toUnit liter`)
        return (inputInCubicMeter * 1000) / tensPow // /=> 10^3 * tensPow
      } else {
        // if (this.toUnit == 'cubic meter')
        console.log(`Convert to toUnit cubic meter`)
        return inputInCubicMeter / tensPow
      }
    },
    temperatureConverter(input, tensPow) {
      console.log('')
      console.log('Enter temperatureConverter()')
      console.log(
        `input: ${input}, tensPow: ${tensPow}, typeof input: ${typeof input}, typeof tensPow: ${typeof tensPow}`
      )
      if (this.toUnit === this.fromUnit) {
        console.log('this.toUnit===this.fromUnit')
        console.log(
          `this.output = input / tensPow: ${(this.output = input / tensPow)}`
        )
        this.output = input / tensPow //str->int
        this.output = this.insertWhiteSpaces(this.output) //int->str
        return
      }
      let inputInCelsius = ''
      let tensPowCelsius = 0
      let handleResult = {}
      switch (this.fromUnit) {
        case 'Fahrenheit (°F)':
          //step 1: convert to celsius first: °C = 5/9 (°F - 32)
          inputInCelsius = (
            ((input - 32) / (5 / 9)) *
            tensPow
          ).toString() /* /10^3=>*tensPow */
          console.log(`Converted to celsius`)
          inputInCelsius = this.numberExponentToLarge(inputInCelsius)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCelsius has decimal point, call the function handleInputWithDecimalPoint(inputInCelsius)
          handleResult = this.hanleInputWithDecimalPoint(inputInCelsius)
          inputInCelsius = handleResult.inputStrWithoutDecimalPoint
          tensPowCelsius = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInCelsius: ${inputInCelsius}, tensPowCelsius: ${tensPowCelsius}`
          )
          //step 3: convert from celsius to the desired unit and then format the output
          this.output = this.temperatureConvFromCelsius(
            inputInCelsius,
            tensPowCelsius
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'Kelvin (K)':
          //step 1: convert to celsius first
          inputInCelsius = (
            (input - 273) /
            tensPow
          ).toString() /* /10^3=>*tensPow */
          console.log(`Converted to celsius`)
          inputInCelsius = this.numberExponentToLarge(inputInCelsius)
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCelsius has decimal point, call the function handleInputWithDecimalPoint(inputInCelsius)
          handleResult = this.hanleInputWithDecimalPoint(inputInCelsius)
          inputInCelsius = handleResult.inputStrWithoutDecimalPoint
          tensPowCelsius = handleResult.tensPow
          console.log(
            `SECOND result from hanleInputWithDecimalPoint is inputInCelsius: ${inputInCelsius}, tensPowCelsius: ${tensPowCelsius}`
          )
          //step 3: convert from celsius to the desired unit and then format the output
          this.output = this.temperatureConvFromCelsius(
            inputCelsius,
            tensPowCelsius
          )
          this.output = this.insertWhiteSpaces(this.output)
          break
        case 'Celsius (°C)':
          //step 1: convert to celsius first: not needed here
          //step 2: avoid calculations with decimal point operands in step 3 - if inputInCelsius has decimal point, call the function handleInputWithDecimalPoint(inputInCelsius) after conversion in celsius: already done in main()-not needed here
          //step 3: convert from celsius to the desired unit and then format the output
          this.output = this.temperatureConvFromCelsius(input, tensPow)
          this.output = this.insertWhiteSpaces(this.output)
          break
        default:
          alert('Please choose units from the dropdown menus')
      }
    },
    temperatureConvFromCelsius(inputInCelsius, tensPow) {
      //ako v skobite ima delenie, i se polu4i decimal point (t.e. 10^x < tensPow), resultatut e greshen.
      //GOAL: two operands, both of which have to be a whole number => the brackets are put in a way that this is always achieved
      //multiplication always comes first, because it can not lead to a decimal point result.
      //cqlo 4islo / cqlo 4islo = veren rezulatat, dori i da sudurja decimal point
      //ako edno ot delimite sudurja decimal point, rezultatut s decimal point shte e greshen, e.g. 0.100000004 vmesto 0.1

      if (this.toUnit === 'Fahrenheit (°F)') {
        console.log(`Convert to toUnit Fahrenheit (°F)`)
        return ((inputInCelsius * 9) / 5 + 32) / tensPow // *=> 10^9 / tensPow
      } else if (this.toUnit === 'Kelvin (K)') {
        console.log(`Convert to toUnit Kelvin (K)`)
        return (inputInCelsius + 273) / tensPow
      } else {
        // if (this.toUnit == 'Celsius (°C)')
        console.log(`Convert to toUnit Celsius (°C)`)
        return inputInCelsius / tensPow
      }
    },

    main() {
      /* Calculation won't perfomed directly on this.input, but on let input instead.
      that is because after this.input is properly formatted the automatic type conversion str->number 
      preceeding the calculations would cause false output (e.g. after adding white spaces to this.input) */
      console.log(``)
      console.log('Enter main()')
      console.log('typeof this.input is ' + typeof this.input)
      console.log('typeof this.output is ' + typeof this.output)

      this.input = this.removeWhiteSpaces(this.input)
      this.input = this.removeRedundantZeros(this.input)
      let input = this.input
      let tensPow = 1
      //The if-statement handles user input with decimal point:
      if (this.input.indexOf(',') !== -1 || this.input.indexOf('.') !== -1) {
        let isValid = this.isValidDecimalPointInput(this.input)
        console.log(`isValidDecimalPointInput: ${isValid}`)
        if (!isValid) {
          return
        } else {
          this.input = this.replaceCommaByDecimalPoint(this.input)
          console.log(`replaceCommaByDecimalPoint: this.input: ${this.input}`)
        }
        input = this.input
        input = this.numberExponentToLarge(input)
        // handleResult is an object, which will contain the user input as a string without the decimal point, as well as an integer number 10 power the of number of decimal places
        let handleResult = this.hanleInputWithDecimalPoint(input)
        input = handleResult.inputStrWithoutDecimalPoint
        tensPow = handleResult.tensPow
        console.log(
          `result from hanleInputWithDecimalPoint is input: ${input}, tensPow: ${tensPow}`
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
        console.log('main: NOT LENGTH')
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
/* background: #285063;
background: #285063;
background: #0ba1e8; */
.converter {
  background: #000;
}
.converter > h1 {
  color: var(--custom-green);
  background: #000;
}
.container {
  width: 80%;
  margin: 0 auto;
  padding: 25vh 0;
  display: grid;
  grid-template-columns: 5fr minmax(75px, 1fr) 5fr;
  grid-gap: 5%;
  justify-content: center;
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

    /*  transform: rotate(90deg);
    box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.2),
      0 1px 15px 0 rgba(0, 0, 0, 0.19); */
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
  background-size: contain;
  background-position: inherit;
  animation-name: temperature1;
  -webkit-animation-name: temperature1;
  -webkit-animation-duration: 2.5s;
  animation-duration: 2.5s;
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
  //transition: ease 2s;
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

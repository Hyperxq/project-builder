Object.defineProperty(exports,"__esModule",{value:!0}),exports.Spinner=void 0;const e=require("tslib").__importDefault(require("ora")),s=require("./color");exports.Spinner=class{constructor(s){this.enabled=!0,this.spinner=(0,e.default)({text:s,hideCursor:!1,discardStdin:!1})}set text(e){this.spinner.text=e}succeed(e){this.enabled&&this.spinner.succeed(e)}info(e){this.spinner.info(e)}fail(e){this.spinner.fail(e&&s.colors.redBright(e))}warn(e){this.spinner.warn(e&&s.colors.yellowBright(e))}stop(){this.spinner.stop()}start(e){this.enabled&&this.spinner.start(e)}};

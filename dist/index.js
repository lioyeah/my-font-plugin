// my-font-plugin/dist/index.js
// Version: 1.1.0 (添加了全局行高，并进行了代码结构优化和注释)
// Description: OrcaNote 插件，用于自定义字体族、全局基础字体大小和全局行高。

// --- 全局变量 ---
let currentPluginName = "my-font-plugin"; // 当前插件的名称，会在 load 时被 OrcaNote 传入的正确名称覆盖
let unsubscribeFromSettings = null; // 用于保存 Valtio 设置订阅的取消函数

// --- 常量定义 ---
// 全局基础字体大小的像素值范围 (用于验证)
const MIN_BASE_FONT_SIZE_PX = 10;
const MAX_BASE_FONT_SIZE_PX = 18;
const DEFAULT_BASE_FONT_SIZE_STRING = "16px"; // schema 中 baseFontSize 的默认字符串值

// 全局行高变量的默认值 (对应 --orca-lineheight-md)
const DEFAULT_GLOBAL_LINE_HEIGHT = "1.6";

// CSS 自定义属性名称常量 (方便管理和避免拼写错误)
const CSS_VAR_EDITOR_FONT_FAMILY = '--orca-fontfamily-editor';
const CSS_VAR_UI_FONT_FAMILY = '--orca-fontfamily-ui';
const CSS_VAR_CODE_FONT_FAMILY = '--orca-fontfamily-code';
const CSS_VAR_BASE_FONT_SIZE = '--orca-fontsize-base';
const CSS_VAR_GLOBAL_LINE_HEIGHT = '--orca-lineheight-md'; // 我们用这个变量实现全局行高

// --- 插件设置的结构定义 (Schema) ---
const settingsSchema = {
  // --- 字体族设置 ---
  editorFontFamily: {
    label: "编辑器字体族 (Editor Font Family)",
    type: "string",
    defaultValue: '"LXGW WenKai TC", "霞鹜文楷 TC", serif',
    description: '例如: "LXGW WenKai TC", serif 或 Arial, sans-serif',
  },
  uiFontFamily: {
    label: "用户界面字体族 (UI Font Family)",
    type: "string",
    defaultValue: '"Microsoft YaHei UI", "微软雅黑", sans-serif',
    description: '例如: "微软雅黑", sans-serif。控制整体 UI 界面的字体。',
  },
  codeFontFamily: {
    label: "代码区域字体族 (Code Font Family)",
    type: "string",
    defaultValue: 'Consolas, "Fira Code", "Source Code Pro", monospace',
    description: '例如: "Fira Code", monospace',
  },

  // --- 全局尺寸设置 ---
  baseFontSize: {
    label: `全局基础字体大小 (Base Font Size, 建议 ${MIN_BASE_FONT_SIZE_PX}px-${MAX_BASE_FONT_SIZE_PX}px)`,
    type: "string",
    defaultValue: DEFAULT_BASE_FONT_SIZE_STRING,
    description: `请输入像素值 (如 16px) 或其他单位 (如 1em)。像素值建议在 ${MIN_BASE_FONT_SIZE_PX}px 到 ${MAX_BASE_FONT_SIZE_PX}px 之间。超出此范围的像素值将使用默认值 "${DEFAULT_BASE_FONT_SIZE_STRING}"。`
  },
  globalLineHeight: {
    label: "全局行高 (Global Line Height)",
    type: "string",
    defaultValue: DEFAULT_GLOBAL_LINE_HEIGHT,
    description: `修改全局行高 (通过影响 ${CSS_VAR_GLOBAL_LINE_HEIGHT})。例如: "${DEFAULT_GLOBAL_LINE_HEIGHT}", "1.5", "1.8em"。`
  }
};

// --- 辅助函数 ---

/**
 * 从已保存的设置或 Schema 的默认值中获取特定设置项的值。
 * @param {string} settingKey - 要获取的设置项的键名。
 * @param {object | undefined | null} savedSettings - 从 orca.state 中获取的已保存设置对象。
 * @returns {string | number | boolean} 设置项的值，如果找不到则返回空字符串或 schema 定义的默认值类型。
 */
function getSettingValue(settingKey, savedSettings) {
  const settingsToUse = savedSettings || {}; // 确保 savedSettings 不是 null/undefined 以安全访问
  // 优先使用已保存的设置值 (即使是空字符串，也表示用户有意设置为空)
  if (settingsToUse[settingKey] !== undefined && settingsToUse[settingKey] !== null) {
    return settingsToUse[settingKey];
  }
  // 如果没有已保存的值，则使用 schema 中定义的默认值
  if (settingsSchema[settingKey] && settingsSchema[settingKey].defaultValue !== undefined) {
    return settingsSchema[settingKey].defaultValue;
  }
  // 如果 schema 中也没有默认值（理论上我们都应该定义），则对于字符串类型返回空字符串
  // 对于其他类型（如 boolean 或 number, 如果以后用到），可能需要不同的后备逻辑
  return "";
}

/**
 * 通用的 CSS 变量应用或移除函数。
 * @param {string} variableName - 要设置的 CSS 变量名 (例如 '--my-color')。
 * @param {string} value - 要设置的值。如果值为空字符串、null 或 undefined，则移除该变量。
 */
function applyOrRemoveCssVar(variableName, value) {
  if (value && typeof value === 'string' && value.trim() !== '') {
    document.documentElement.style.setProperty(variableName, value, 'important');
    console.log(`[${currentPluginName}] applyCustomStyles TRACE - Applied ${variableName}: ${value}`);
  } else {
    document.documentElement.style.removeProperty(variableName);
    console.log(`[${currentPluginName}] applyCustomStyles TRACE - Removed ${variableName} (value was effectively empty).`);
  }
}

/**
 * 应用字体族相关的设置。
 * @param {object} params - 包含各字体族设置值的对象。
 * @param {string} params.editorFontFamily
 * @param {string} params.uiFontFamily
 * @param {string} params.codeFontFamily
 */
function applyFontFamilySettings({ editorFontFamily, uiFontFamily, codeFontFamily }) {
  applyOrRemoveCssVar(CSS_VAR_EDITOR_FONT_FAMILY, editorFontFamily);
  applyOrRemoveCssVar(CSS_VAR_UI_FONT_FAMILY, uiFontFamily);
  applyOrRemoveCssVar(CSS_VAR_CODE_FONT_FAMILY, codeFontFamily);
}

/**
 * 应用并验证全局基础字体大小设置。
 * @param {string} baseFontSizeSetting - 从设置中获取的原始 baseFontSize 值。
 */
function applyBaseFontSizeSetting(baseFontSizeSetting) {
  let finalBaseFontSizeToApplyPx = DEFAULT_BASE_FONT_SIZE_STRING; // 初始化为 schema 的默认字符串值
  let validationNotification = null;

  if (baseFontSizeSetting && typeof baseFontSizeSetting === 'string' && baseFontSizeSetting.trim() !== '') {
    const trimmedUserInput = baseFontSizeSetting.trim();
    if (trimmedUserInput.toLowerCase().endsWith('px')) {
      const numericValue = parseFloat(trimmedUserInput.replace(/px/i, ''));
      if (!isNaN(numericValue)) {
        if (numericValue < MIN_BASE_FONT_SIZE_PX) {
          validationNotification = `输入的基础字体大小 "${trimmedUserInput}" 小于允许的最小值 ${MIN_BASE_FONT_SIZE_PX}px。已应用默认大小 "${DEFAULT_BASE_FONT_SIZE_STRING}"。`;
        } else if (numericValue > MAX_BASE_FONT_SIZE_PX) {
          validationNotification = `输入的基础字体大小 "${trimmedUserInput}" 大于允许的最大值 ${MAX_BASE_FONT_SIZE_PX}px。已应用默认大小 "${DEFAULT_BASE_FONT_SIZE_STRING}"。`;
        } else {
          finalBaseFontSizeToApplyPx = trimmedUserInput; // 输入值在允许的 px 范围内
        }
      } else { // 'px' 后不是有效数字
        validationNotification = `基础字体大小 "${trimmedUserInput}" 不是有效的像素值。已应用默认大小 "${DEFAULT_BASE_FONT_SIZE_STRING}"。`;
      }
    } else { // 不是 'px' 单位 (例如 'em', 'rem', '%')，则直接应用
      finalBaseFontSizeToApplyPx = trimmedUserInput;
      console.log(`[${currentPluginName}] Applying non-px baseFontSize: ${finalBaseFontSizeToApplyPx}`);
    }
  } else { // baseFontSizeSetting 为空字符串、null 或 undefined
    console.log(`[${currentPluginName}] baseFontSizeSetting was empty. Using schema default: ${DEFAULT_BASE_FONT_SIZE_STRING}`);
    // finalBaseFontSizeToApplyPx 此时已经是 DEFAULT_BASE_FONT_SIZE_STRING
  }

  if (validationNotification) {
    orca.notify("warn", `[${currentPluginName}] ${validationNotification}`);
    console.warn(`[${currentPluginName}] ${validationNotification} (Original input: "${baseFontSizeSetting}", Effective value for ${CSS_VAR_BASE_FONT_SIZE}: "${finalBaseFontSizeToApplyPx}")`);
  }
  applyOrRemoveCssVar(CSS_VAR_BASE_FONT_SIZE, finalBaseFontSizeToApplyPx);
}

/**
 * 应用全局行高设置。
 * @param {string} globalLineHeightSetting - 从设置中获取的 globalLineHeight 值。
 */
function applyGlobalLineHeightSetting(globalLineHeightSetting) {
  // 对于行高，我们暂时不加复杂验证，直接应用用户输入或默认值
  // 空值会通过 applyOrRemoveCssVar 被处理为移除属性
  applyOrRemoveCssVar(CSS_VAR_GLOBAL_LINE_HEIGHT, globalLineHeightSetting);
}


// --- 核心样式应用函数 (现在更为简洁) ---
function applyCustomStyles(savedSettings) {
  console.log(`[${currentPluginName}] applyCustomStyles TRACE - 1. Called with savedSettings:`, savedSettings ? JSON.parse(JSON.stringify(savedSettings)) : "undefined");

  // 获取所有设置的最终生效值
  const editorFontFamily = getSettingValue('editorFontFamily', savedSettings);
  const uiFontFamily = getSettingValue('uiFontFamily', savedSettings);
  const codeFontFamily = getSettingValue('codeFontFamily', savedSettings);
  const baseFontSize = getSettingValue('baseFontSize', savedSettings);
  const globalLineHeight = getSettingValue('globalLineHeight', savedSettings);

  console.log(`[${currentPluginName}] applyCustomStyles TRACE - 3. Effective values to apply:`, {
    editorFontFamily, uiFontFamily, codeFontFamily, baseFontSize, globalLineHeight
  });

  applyFontFamilySettings({ editorFontFamily, uiFontFamily, codeFontFamily });
  applyBaseFontSizeSetting(baseFontSize);
  applyGlobalLineHeightSetting(globalLineHeight);
}

// --- 插件生命周期函数 ---

/**
 * 插件加载时执行。
 * 负责注册设置、加载初始设置、应用样式、订阅设置变化。
 */
export async function load(pluginName) {
  currentPluginName = pluginName; // 更新为 OrcaNote 传入的实际插件名
  console.log(`[${currentPluginName}] load TRACE - 1. Plugin loading... (Version: 1.1.0)`);

  try {
    // 注册设置 Schema
    await orca.plugins.setSettingsSchema(currentPluginName, settingsSchema);
    console.log(`[${currentPluginName}] load TRACE - 2. Settings schema registered.`);

    // 获取并应用初始设置
    // orca.state.plugins[currentPluginName]?.settings 会返回已保存的设置对象，或者在没有任何设置被保存过时返回 undefined
    const initialSettings = orca.state.plugins[currentPluginName]?.settings;
    console.log(`[${currentPluginName}] load TRACE - 3. Initial settings from orca.state:`, initialSettings ? JSON.parse(JSON.stringify(initialSettings)) : "undefined");
    applyCustomStyles(initialSettings); // applyCustomStyles 内部会处理 initialSettings 为 undefined 的情况 (使用 schema 默认值)

    // 订阅设置变化 (使用 Valtio)
    if (window.Valtio && typeof window.Valtio.subscribe === 'function') {
      const pluginSettingsPathRoot = ['plugins', currentPluginName, 'settings'];
      unsubscribeFromSettings = window.Valtio.subscribe(orca.state, (ops) => {
        // 检查发生变化的状态路径是否与本插件的设置相关
        const changedRelevantSettings = ops.some(opChange => {
          const path = opChange[1]; // path 是一个数组，例如 ['plugins', 'my-font-plugin', 'settings', 'editorFontFamily']
          return (
            Array.isArray(path) &&
            path.length >= pluginSettingsPathRoot.length &&
            path[0] === pluginSettingsPathRoot[0] && // 'plugins'
            path[1] === pluginSettingsPathRoot[1] && // currentPluginName
            path[2] === pluginSettingsPathRoot[2]    // 'settings'
          );
        });

        if (changedRelevantSettings) {
          const newSettings = orca.state.plugins[currentPluginName]?.settings;
          console.log(`[${currentPluginName}] load TRACE - 5. Settings changed via subscription, new settings:`, newSettings ? JSON.parse(JSON.stringify(newSettings)) : "undefined");
          applyCustomStyles(newSettings);
        }
      });
      console.log(`[${currentPluginName}] load TRACE - 6. Subscribed to settings changes.`);
    } else {
      console.warn(`[${currentPluginName}] load TRACE - 6. window.Valtio.subscribe not available. Settings changes may require plugin reload or app restart to apply.`);
      orca.notify("warn", `[${currentPluginName}] 字体样式设置实时更新可能不可用，更改后请尝试重启插件或应用。`);
    }

    orca.notify("info", `[${currentPluginName}] 插件已加载，请在设置中配置字体样式！`);
  } catch (error) {
    console.error(`[${currentPluginName}] load TRACE - E. Error loading plugin:`, error);
    orca.notify("error", `[${currentPluginName}] 加载失败: ${error.message}`);
  }
}

/**
 * 插件卸载时执行。
 * 负责清理工作，如取消订阅、移除动态添加的样式。
 */
export async function unload() {
  console.log(`[${currentPluginName}] unload TRACE - 1. Plugin unloading...`);

  // 取消订阅设置变化
  if (unsubscribeFromSettings) {
    unsubscribeFromSettings();
    unsubscribeFromSettings = null;
    console.log(`[${currentPluginName}] unload TRACE - 2. Unsubscribed from settings changes.`);
  }

  // 移除所有本插件可能设置过的 CSS 自定义属性
  document.documentElement.style.removeProperty(CSS_VAR_EDITOR_FONT_FAMILY);
  document.documentElement.style.removeProperty(CSS_VAR_UI_FONT_FAMILY);
  document.documentElement.style.removeProperty(CSS_VAR_CODE_FONT_FAMILY);
  document.documentElement.style.removeProperty(CSS_VAR_BASE_FONT_SIZE);
  document.documentElement.style.removeProperty(CSS_VAR_GLOBAL_LINE_HEIGHT);

  console.log(`[${currentPluginName}] unload TRACE - 3. Custom font styles removed from :root.`);
  orca.notify("info", `[${currentPluginName}] 插件已卸载，自定义字体样式已移除。`);
}
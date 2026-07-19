export enum RuleType {
    // Common
    Required = "required",
    Optional = "optional",
    Nullable = "nullable",
    Default = "default",
    Transform = "transform",
    Refine = "refine",
    AllowedValues = "allowedValues",

    // String
    StringMin = "string:min",
    StringMax = "string:max",
    StringRegex = "string:regex",
    StringTrim = "string:trim",
    StringLowercase = "string:lowercase",
    StringUppercase = "string:uppercase",

    // Number
    NumberMin = "number:min",
    NumberMax = "number:max",

    // Boolean
    BooleanTrueValues = "boolean:trueValues",
    BooleanFalseValues = "boolean:falseValues",
}
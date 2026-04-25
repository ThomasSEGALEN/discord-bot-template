import {
    ButtonBuilder,
    ButtonComponentData,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelSelectMenuComponentData,
    ColorResolvable,
    Colors,
    ComponentInLabelData,
    ComponentType,
    EmbedBuilder,
    EmbedData,
    LabelComponentData,
    Locale,
    LocalizationMap,
    MentionableSelectMenuBuilder,
    MentionableSelectMenuComponentData,
    ModalBuilder,
    ModalComponentData,
    resolveColor,
    RoleSelectMenuBuilder,
    RoleSelectMenuComponentData,
    StringSelectMenuBuilder,
    StringSelectMenuComponentData,
    TextDisplayComponentData,
    UserSelectMenuBuilder,
    UserSelectMenuComponentData,
} from 'discord.js';
import { Linguini, TypeMapper, TypeMappers, Utils } from 'linguini';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Language } from '../models/enum-helpers/index.js';

type AnySelectMenuBuilder =
    | ChannelSelectMenuBuilder
    | MentionableSelectMenuBuilder
    | RoleSelectMenuBuilder
    | StringSelectMenuBuilder
    | UserSelectMenuBuilder;

type AnySelectMenuComponentData =
    | ChannelSelectMenuComponentData
    | MentionableSelectMenuComponentData
    | RoleSelectMenuComponentData
    | StringSelectMenuComponentData
    | UserSelectMenuComponentData;
export class Lang {
    private static linguini = new Linguini(
        path.resolve(dirname(fileURLToPath(import.meta.url)), '../../lang'),
        'lang'
    );

    public static getEmbed(
        location: string,
        langCode: Locale,
        variables?: { [name: string]: string }
    ): EmbedBuilder {
        return (
            this.linguini.get(location, langCode, this.embedTm, variables) ??
            this.linguini.get(location, Language.Default, this.embedTm, variables)
        );
    }

    public static getButton(
        location: string,
        langCode: Locale,
        variables?: { [name: string]: string }
    ): ButtonBuilder {
        return (
            this.linguini.get(location, langCode, this.buttonTm, variables) ??
            this.linguini.get(location, Language.Default, this.buttonTm, variables)
        );
    }

    public static getSelectMenu<T extends AnySelectMenuBuilder>(
        location: string,
        langCode: Locale,
        variables?: { [name: string]: string }
    ): T {
        return (this.linguini.get(location, langCode, this.selectMenuTm, variables) ??
            this.linguini.get(location, Language.Default, this.selectMenuTm, variables)) as T;
    }

    public static getModal(
        location: string,
        langCode: Locale,
        variables?: { [name: string]: string }
    ): ModalBuilder {
        return (
            this.linguini.get(location, langCode, this.modalTm, variables) ??
            this.linguini.get(location, Language.Default, this.modalTm, variables)
        );
    }

    public static getRegex(location: string, langCode: Locale): RegExp {
        return (
            this.linguini.get(location, langCode, TypeMappers.RegExp) ??
            this.linguini.get(location, Language.Default, TypeMappers.RegExp)
        );
    }

    public static getRef(
        location: string,
        langCode: Locale,
        variables?: { [name: string]: string }
    ): string {
        return (
            this.linguini.getRef(location, langCode, variables) ??
            this.linguini.getRef(location, Language.Default, variables)
        );
    }

    public static getRefLocalizationMap(
        location: string,
        variables?: { [name: string]: string }
    ): LocalizationMap {
        let obj: LocalizationMap = {};
        for (let langCode of Language.Enabled) {
            obj[langCode] = this.getRef(location, langCode, variables);
        }
        return obj;
    }

    public static getCom(location: string, variables?: { [name: string]: string }): string {
        return this.linguini.getCom(location, variables);
    }

    private static embedTm: TypeMapper<EmbedBuilder> = (jsonValue: EmbedData) => {
        return new EmbedBuilder({
            color: resolveColor(Lang.parseColor(jsonValue.color)),
            url: jsonValue.url,
            author: jsonValue.author
                ? {
                      name: jsonValue.author.name,
                      iconURL: jsonValue.author.iconURL,
                      url: jsonValue.author.url,
                  }
                : undefined,
            title: jsonValue.title ? Utils.join(jsonValue.title, '\n') : undefined,
            description: jsonValue.description
                ? Utils.join(jsonValue.description, '\n')
                : undefined,
            thumbnail: jsonValue.thumbnail
                ? {
                      url: jsonValue.thumbnail.url,
                      height: jsonValue.thumbnail.height,
                      width: jsonValue.thumbnail.width,
                  }
                : undefined,
            fields: jsonValue.fields?.map(field => ({
                name: Utils.join(field.name, '\n'),
                value: Utils.join(field.value, '\n'),
                inline: field.inline ? field.inline : false,
            })),
            image: jsonValue.image
                ? {
                      url: jsonValue.image.url,
                      height: jsonValue.image.height,
                      width: jsonValue.image.width,
                  }
                : undefined,
            footer: jsonValue.footer
                ? {
                      text: Utils.join(jsonValue.footer.text ?? '', '\n'),
                      iconURL: jsonValue.footer.iconURL,
                  }
                : undefined,
            timestamp: jsonValue.timestamp ? new Date() : undefined,
        });
    };

    private static buttonTm: TypeMapper<ButtonBuilder> = (jsonValue: ButtonComponentData) => {
        switch (jsonValue.style) {
            case ButtonStyle.Link:
                return new ButtonBuilder({
                    type: jsonValue.type,
                    emoji: jsonValue.emoji,
                    label: jsonValue.label,
                    style: jsonValue.style,
                    url: jsonValue.url,
                    disabled: jsonValue.disabled,
                });
            case ButtonStyle.Primary ||
                ButtonStyle.Secondary ||
                ButtonStyle.Success ||
                ButtonStyle.Danger ||
                ButtonStyle.Premium:
                return new ButtonBuilder({
                    customId: jsonValue.customId,
                    type: jsonValue.type,
                    emoji: jsonValue.emoji,
                    label: jsonValue.label,
                    style: jsonValue.style,
                    disabled: jsonValue.disabled,
                });
            default:
                throw new Error('Invalid button style');
        }
    };

    private static selectMenuTm: TypeMapper<AnySelectMenuBuilder> = <
        T extends AnySelectMenuBuilder,
    >(
        jsonValue: AnySelectMenuComponentData
    ): T => {
        switch (jsonValue.type) {
            case ComponentType.ChannelSelect:
                return new ChannelSelectMenuBuilder({
                    customId: jsonValue.customId,
                    type: jsonValue.type,
                    placeholder: jsonValue.placeholder,
                    minValues: jsonValue.minValues,
                    maxValues: jsonValue.maxValues,
                    defaultValues: jsonValue.defaultValues,
                    channelTypes: jsonValue.channelTypes,
                    required: jsonValue.required,
                    disabled: jsonValue.disabled,
                }) as T;
            case ComponentType.MentionableSelect:
                return new MentionableSelectMenuBuilder({
                    customId: jsonValue.customId,
                    type: jsonValue.type,
                    placeholder: jsonValue.placeholder,
                    minValues: jsonValue.minValues,
                    maxValues: jsonValue.maxValues,
                    defaultValues: jsonValue.defaultValues,
                    required: jsonValue.required,
                    disabled: jsonValue.disabled,
                }) as T;
            case ComponentType.RoleSelect:
                return new RoleSelectMenuBuilder({
                    customId: jsonValue.customId,
                    type: jsonValue.type,
                    placeholder: jsonValue.placeholder,
                    minValues: jsonValue.minValues,
                    maxValues: jsonValue.maxValues,
                    defaultValues: jsonValue.defaultValues,
                    required: jsonValue.required,
                    disabled: jsonValue.disabled,
                }) as T;
            case ComponentType.StringSelect:
                return new StringSelectMenuBuilder({
                    customId: jsonValue.customId,
                    type: jsonValue.type,
                    placeholder: jsonValue.placeholder,
                    options: jsonValue.options,
                    minValues: jsonValue.minValues,
                    maxValues: jsonValue.maxValues,
                    required: jsonValue.required,
                    disabled: jsonValue.disabled,
                }) as T;
            case ComponentType.UserSelect:
                return new UserSelectMenuBuilder({
                    customId: jsonValue.customId,
                    type: jsonValue.type,
                    placeholder: jsonValue.placeholder,
                    minValues: jsonValue.minValues,
                    maxValues: jsonValue.maxValues,
                    defaultValues: jsonValue.defaultValues,
                    required: jsonValue.required,
                    disabled: jsonValue.disabled,
                }) as T;
            default:
                throw new Error('Invalid select menu type');
        }
    };

    private static modalTm: TypeMapper<ModalBuilder> = (jsonValue: ModalComponentData) => {
        return new ModalBuilder({
            customId: jsonValue.customId,
            title: jsonValue.title,
            components: (
                jsonValue.components as (LabelComponentData | TextDisplayComponentData)[]
            ).map(component => {
                if (component.type === ComponentType.Label) {
                    const labelComponent = component as LabelComponentData;
                    let componentInLabel: ComponentInLabelData;

                    switch (labelComponent.component.type) {
                        case ComponentType.StringSelect:
                            componentInLabel = {
                                customId: labelComponent.component.customId,
                                type: labelComponent.component.type,
                                placeholder: labelComponent.component.placeholder
                                    ? Utils.join(labelComponent.component.placeholder, '\n')
                                    : undefined,
                                options: labelComponent.component.options,
                                minValues: labelComponent.component.minValues,
                                maxValues: labelComponent.component.maxValues,
                                required: labelComponent.component.required,
                                disabled: labelComponent.component.disabled,
                            };
                            break;
                        case ComponentType.TextInput:
                            componentInLabel = {
                                customId: labelComponent.component.customId,
                                type: labelComponent.component.type,
                                style: labelComponent.component.style,
                                label: labelComponent.component.label,
                                placeholder: labelComponent.component.placeholder
                                    ? Utils.join(labelComponent.component.placeholder, '\n')
                                    : undefined,
                                value: labelComponent.component.value,
                                minLength: labelComponent.component.minLength,
                                maxLength: labelComponent.component.maxLength,
                                required: labelComponent.component.required,
                            };
                            break;
                        case ComponentType.UserSelect:
                            componentInLabel = {
                                customId: labelComponent.component.customId,
                                type: labelComponent.component.type,
                                defaultValues: labelComponent.component.defaultValues,
                                minValues: labelComponent.component.minValues,
                                maxValues: labelComponent.component.maxValues,
                                required: labelComponent.component.required,
                                disabled: labelComponent.component.disabled,
                            };
                            break;
                        case ComponentType.ChannelSelect:
                            componentInLabel = {
                                customId: labelComponent.component.customId,
                                type: labelComponent.component.type,
                                channelTypes: labelComponent.component.channelTypes,
                                placeholder: labelComponent.component.placeholder
                                    ? Utils.join(labelComponent.component.placeholder, '\n')
                                    : undefined,
                                defaultValues: labelComponent.component.defaultValues,
                                minValues: labelComponent.component.minValues,
                                maxValues: labelComponent.component.maxValues,
                                required: labelComponent.component.required,
                                disabled: labelComponent.component.disabled,
                            };
                            break;
                        case ComponentType.RoleSelect:
                            componentInLabel = {
                                customId: labelComponent.component.customId,
                                type: labelComponent.component.type,
                                placeholder: labelComponent.component.placeholder
                                    ? Utils.join(labelComponent.component.placeholder, '\n')
                                    : undefined,
                                defaultValues: labelComponent.component.defaultValues,
                                minValues: labelComponent.component.minValues,
                                maxValues: labelComponent.component.maxValues,
                                required: labelComponent.component.required,
                                disabled: labelComponent.component.disabled,
                            };
                            break;
                        case ComponentType.MentionableSelect:
                            componentInLabel = {
                                customId: labelComponent.component.customId,
                                type: labelComponent.component.type,
                                placeholder: labelComponent.component.placeholder
                                    ? Utils.join(labelComponent.component.placeholder, '\n')
                                    : undefined,
                                defaultValues: labelComponent.component.defaultValues,
                                minValues: labelComponent.component.minValues,
                                maxValues: labelComponent.component.maxValues,
                                required: labelComponent.component.required,
                                disabled: labelComponent.component.disabled,
                            };
                            break;
                        case ComponentType.FileUpload:
                            componentInLabel = {
                                customId: labelComponent.component.customId,
                                type: labelComponent.component.type,
                                minValues: labelComponent.component.minValues,
                                maxValues: labelComponent.component.maxValues,
                                required: labelComponent.component.required,
                            };
                            break;
                        default:
                            throw new Error('Invalid component type in label');
                    }

                    return {
                        type: labelComponent.type,
                        label: labelComponent.label,
                        description: labelComponent.description,
                        component: componentInLabel,
                    };
                } else if (component.type === ComponentType.TextDisplay) {
                    return {
                        type: component.type,
                        content: Utils.join(component.content, '\n'),
                    };
                } else {
                    throw new Error('Invalid modal component type');
                }
            }),
        });
    };

    private static parseColor(input?: string | number): ColorResolvable {
        if (!input) {
            input = Lang.getCom('colors.default');
        }
        if (typeof input === 'number') return input;
        if (input in Colors) return input as keyof typeof Colors;

        const hex = input.replace(/^#/, '');
        const normalized =
            hex.length === 3
                ? hex
                      .split('')
                      .map(c => c + c)
                      .join('')
                : hex;
        const parsed = parseInt(normalized, 16);

        return Number.isNaN(parsed) ? 0x000000 : parsed;
    }
}

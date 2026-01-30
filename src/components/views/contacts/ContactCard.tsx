/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import classNames from "classnames";

import { type ContactItem } from "../../../models/ContactItem";
import AccessibleButton from "../elements/AccessibleButton";
import BaseAvatar from "../avatars/BaseAvatar";
import { _t } from "../../../languageHandler";

interface ContactCardProps {
    contact: ContactItem;
    onClick: (contact: ContactItem) => void;
}

/**
 * Contact card component showing contact info and online status
 */
export default class ContactCard extends React.PureComponent<ContactCardProps> {
    private onClick = (): void => {
        this.props.onClick(this.props.contact);
    };

    public render(): React.ReactNode {
        const { contact } = this.props;

        return (
            <AccessibleButton className="mx_ContactCard" onClick={this.onClick}>
                <div className="mx_ContactCard_avatar">
                    <BaseAvatar
                        name={contact.displayName}
                        idName={contact.id}
                        url={contact.avatarURL}
                        width={40}
                        height={40}
                    />
                </div>
                <div className="mx_ContactCard_info">
                    <div className="mx_ContactCard_name">{contact.displayName}</div>
                    <div
                        className={classNames("mx_ContactCard_status", {
                            "mx_ContactCard_status_online": contact.isOnline,
                        })}
                    >
                        <span className="mx_ContactCard_status_indicator" />
                        <span className="mx_ContactCard_status_text">
                            {contact.isOnline ? _t("contacts|status_online") : _t("contacts|status_offline")}
                        </span>
                    </div>
                </div>
            </AccessibleButton>
        );
    }
}

const User = require("../models/User");
const { registerService, loginService } = require("../services/auth");
const { findUserByProperty } = require("../services/user");
const bcrypt = require("bcryptjs");
const { assignToken } = require("../utils/jwtFunction");
const AppError = require("../utils/AppError");

// controller for register
const registerController = async (req, res, next) => {

  
  const { email, password } = req.body;

  //   validation
  if (!email || !password) {
    throw new AppError("Email and Password are required", 400);
  }

  try {
    const user = await registerService({
      email,
      password,
    });
    user.password = undefined;

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next(error);
  }
};

// controller for user login
const logInController = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await loginService(email, password);
    return res.send({ status: 200, data: user });
  } catch (error) {
    return res.json({ status: 500, message: `server error ${error} ` });
  }
};

// controller for social login
const logInWithSocialController = async (req, res, next) => {
  const {
    oauth_id,
    email,
    oauth_provider,
    profile_picture,
    firstName,
    lastName,
  } = req.body;

  try {
    let user = await findUserByProperty("email", email);

    if (!user) {
      user = await User.create({
        oauth_id,
        email,
        oauth_provider,
        profile_picture,
        name: `${firstName} ${lastName}`,
      });
    }

    const token = assignToken(email);
    const userObj = user.toObject();
    userObj.jwtToken = token;

    return res.json({
      status: 200,
      message: "social login successfull",
      user: userObj,
    });
  } catch (error) {
    return res.json({ status: 500, message: `server error ${error} ` });
  }
};

module.exports = {
  registerController,
  logInController,
  logInWithSocialController,
};

// {
//     "id": "user_2zdPpzGC8mn8wIGwW1bCA8XomBi",
//     "pathRoot": "/me",
//     "externalId": null,
//     "username": null,
//     "emailAddresses": [
//         {
//             "id": "idn_2zdPnmQiWhUUdaVdgbDbHmjW0l4",
//             "pathRoot": "/me/email_addresses",
//             "emailAddress": "anamhaque.5101@gmail.com",
//             "matchesSsoConnection": false,
//             "linkedTo": [
//                 {
//                     "id": "idn_2zdPnkXb2wQvpzKbvuwUNE9XsLD",
//                     "pathRoot": "",
//                     "type": "oauth_google"
//                 }
//             ],
//             "verification": {
//                 "pathRoot": "",
//                 "status": "verified",
//                 "strategy": "from_oauth_google",
//                 "nonce": null,
//                 "message": null,
//                 "externalVerificationRedirectURL": null,
//                 "attempts": null,
//                 "expireAt": "2025-07-10T07:58:28.189Z",
//                 "error": null
//             }
//         }
//     ],
//     "phoneNumbers": [],
//     "web3Wallets": [],
//     "externalAccounts": [
//         {
//             "id": "eac_2zdPni1pDO3aQxsv8f1J2wdaVMu",
//             "pathRoot": "/me/external_accounts",
//             "identificationId": "idn_2zdPnkXb2wQvpzKbvuwUNE9XsLD",
//             "provider": "google",
//             "providerUserId": "115015963465776611097",
//             "emailAddress": "anamhaque.5101@gmail.com",
//             "approvedScopes": "email https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid profile",
//             "firstName": "Md. Anamul",
//             "lastName": "Haque",
//             "imageUrl": "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLMXc1SlYySGpmZlRZLU9LdnMtVUFPRTUya19ObGk1Rk8wNHhnOHhWU3lfc2dsMVJyTj1zMTAwMC1jIiwicyI6IjExZ3lKTE5tM2tjZE5hQWwzNkZ4dmRwdXA0YzhVdVZXYTNTL2Faa2E1WG8ifQ",
//             "username": "",
//             "phoneNumber": "",
//             "publicMetadata": {},
//             "label": null,
//             "verification": {
//                 "pathRoot": "",
//                 "status": "verified",
//                 "strategy": "oauth_google",
//                 "nonce": null,
//                 "message": null,
//                 "externalVerificationRedirectURL": null,
//                 "attempts": null,
//                 "expireAt": "2025-07-09T10:58:36.032Z",
//                 "error": null
//             }
//         }
//     ],
//     "enterpriseAccounts": [],
//     "passkeys": [],
//     "samlAccounts": [],
//     "organizationMemberships": [],
//     "passwordEnabled": false,
//     "firstName": "Md. Anamul",
//     "lastName": "Haque",
//     "fullName": "Md. Anamul Haque",
//     "primaryEmailAddressId": "idn_2zdPnmQiWhUUdaVdgbDbHmjW0l4",
//     "primaryEmailAddress": {
//         "id": "idn_2zdPnmQiWhUUdaVdgbDbHmjW0l4",
//         "pathRoot": "/me/email_addresses",
//         "emailAddress": "anamhaque.5101@gmail.com",
//         "matchesSsoConnection": false,
//         "linkedTo": [
//             {
//                 "id": "idn_2zdPnkXb2wQvpzKbvuwUNE9XsLD",
//                 "pathRoot": "",
//                 "type": "oauth_google"
//             }
//         ],
//         "verification": {
//             "pathRoot": "",
//             "status": "verified",
//             "strategy": "from_oauth_google",
//             "nonce": null,
//             "message": null,
//             "externalVerificationRedirectURL": null,
//             "attempts": null,
//             "expireAt": "2025-07-10T07:58:28.189Z",
//             "error": null
//         }
//     },
//     "primaryPhoneNumberId": null,
//     "primaryPhoneNumber": null,
//     "primaryWeb3WalletId": null,
//     "primaryWeb3Wallet": null,
//     "imageUrl": "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18yemRQcHpVeThHWUw1UGdFWTJNemp1T0JiMUQifQ",
//     "hasImage": true,
//     "twoFactorEnabled": false,
//     "totpEnabled": false,
//     "backupCodeEnabled": false,
//     "publicMetadata": {},
//     "unsafeMetadata": {},
//     "createOrganizationEnabled": true,
//     "createOrganizationsLimit": null,
//     "deleteSelfEnabled": true,
//     "lastSignInAt": "2025-07-10T07:35:36.495Z",
//     "legalAcceptedAt": null,
//     "updatedAt": "2025-07-10T07:35:36.519Z",
//     "createdAt": "2025-07-09T10:49:23.181Z",
//     "cachedSessionsWithActivities": null
// }

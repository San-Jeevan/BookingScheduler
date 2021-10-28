using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Kantinebooking.Models;
using System.Collections;
using JWT.Algorithms;
using JWT.Builder;
using static Kantinebooking.Helpers.JWTMiddleware;

namespace Kantinebooking.Helpers
{

    public interface ITokenValidator
    {
        Task<GetTokenResponse> ValidateMSToken(string jwtToken);
        GetTokenResponse ValidateAppToken(string jwtToken);
    }

    public class TokenValidator: ITokenValidator
    {
        string clientId = "";
        //string jwtToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlNzWnNCTmhaY0YzUTlTNHRycFFCVEJ5TlJSSSJ9.eyJhdWQiOiI1ZDE1OGM5YS04ODU2LTRjY2QtYmRlNS1hNzI5OTdkNmQwZWIiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vZTgzYTExMTItMWMyMS00YTcxLTk2MDMtYzU4N2ViMzJiMzg0L3YyLjAiLCJpYXQiOjE1OTQwNDA1MjcsIm5iZiI6MTU5NDA0MDUyNywiZXhwIjoxNTk0MDQ0NDI3LCJhaW8iOiJBVFFBeS84UUFBQUFTZzRVYmx2N0kxS2RuUnVHM1p5MHo4WUtQblVvUnBUV3U0eHh1Y2sxZ3d3QlVYVml0S0tMV0hZa2xXTi9BY3Q3IiwibmFtZSI6IkplZXZhbiBTaXZhZ25hbmFzdW50aGFyYW0iLCJub25jZSI6ImVmNTk3ZGY5LTdhNjgtNGY1Zi1hYzhlLWZiNjQzNTRhYWM3OCIsIm9pZCI6ImFmNTc4MDQwLTZmNzEtNGNkNC05ZjllLTljMmRmODFkY2YzNiIsInByZWZlcnJlZF91c2VybmFtZSI6InB1MTIwNUB1ZGYubm8iLCJzdWIiOiI0c0hiWFkyYm42WmFMNk13Z2lYUXI1ZU82UWk2eS1IdDRYWEVzQlM5XzV3IiwidGlkIjoiZTgzYTExMTItMWMyMS00YTcxLTk2MDMtYzU4N2ViMzJiMzg0IiwidXRpIjoiUFF1eGlwS05iMC1DNWtRaURrTllBQSIsInZlciI6IjIuMCJ9.Ya3S8TeotGh7NJHcLTpvUpmNBdWXdCMltqxSu6_JsuXds8Xgl_YjTb2xY2ZwcPNX92ViXKN2sMZb6JyYz3n7CDtWiNx0Low9Mld7NTcwzgW4ag_hYJnZ6ktQTRtIy8-tkQ7zjCjGIQzfs29Zu5LjfaZlizR37BRi7D78mYB4mZLcBKdEf1-xjhNb-fbSx8RM38QPz60nQN4XBCUU5SYtkqPzjWxdnMxtjhwRHh7kW_9e_BNNnEPRJ1tysfx5bMBlriVcpy094bSq9R9K5GZEe5NG-2kcdE7-3DkIkHZAOkvzwraaPqQ2aYc2eEdaJgThH_x49RIx2NQ3KTIZweon5A";
        string stsDiscoveryEndpoint = "";
        string authority = "";
        private IConfiguration _configuration;
        private ILogger _logger;


        public TokenValidator(IConfiguration configuration, ILoggerFactory loggerFactory)
        {
            _configuration = configuration;
            _logger = loggerFactory.CreateLogger("MSTokenValidator");
            var adconf = _configuration["AzureAd:TenantId"];
            clientId = _configuration["AzureAd:ClientId"];
            authority = $"https://login.microsoftonline.com/{adconf}/v2.0";
            stsDiscoveryEndpoint = $"{authority}/.well-known/openid-configuration";
        }

        public async Task<GetTokenResponse> ValidateMSToken(string jwtToken)
        {
            OpenIdConnectConfigurationRetriever configRetriever = new OpenIdConnectConfigurationRetriever();
            ConfigurationManager<OpenIdConnectConfiguration> configManager =
                new ConfigurationManager<OpenIdConnectConfiguration>(stsDiscoveryEndpoint, configRetriever);
            OpenIdConnectConfiguration config = await configManager.GetConfigurationAsync();


            TokenValidationParameters validationParameters = new TokenValidationParameters
            {
                ValidIssuer = config.Issuer,
                ValidateIssuer = true,
                ValidateIssuerSigningKey = false,
                ValidAudience = clientId,
                ValidateAudience = true,
                IssuerSigningKeys = config.SigningKeys,
                RequireExpirationTime = true,
                RequireSignedTokens = true
            };

            SecurityToken validatedToken = new JwtSecurityToken();
            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            ClaimsPrincipal validationResult = null;

            try
            {
                validationResult = tokenHandler.ValidateToken(jwtToken, validationParameters, out validatedToken);
                IEnumerator claims = validationResult.Claims.GetEnumerator();
                var name = validationResult.Claims.Where(x => x.Type == "name").First();
                var username = validationResult.Claims.Where(x => x.Type == "preferred_username").First();
                return new GetTokenResponse() { Success = true, Token = jwtToken, Name = name.Value, UserName = username.Value };
            }
            catch (Exception ex)
            {
                return new GetTokenResponse() { Success = false, Message = ex.Message };
            }
        }   
        
        
        public GetTokenResponse ValidateAppToken(string jwtToken)
        {
            try
            {
                var decoded_token = new JwtBuilder().WithAlgorithm(new HMACSHA256Algorithm()).WithSecret(_configuration["JWTsecretkey"]).MustVerifySignature().Decode<JWTmodel>(jwtToken);
                return new GetTokenResponse() { Name = decoded_token.Name, UserName = decoded_token.Username, Token = jwtToken };
            }
            catch (Exception ex)
            {
                return new GetTokenResponse() { Success = false, Message = ex.Message };
            }
        }
    }
}

using JWT.Algorithms;
using JWT.Builder;
using Kantinebooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Threading.Tasks;

namespace Kantinebooking.Helpers
{
    public sealed class JWTMiddleware : IAsyncAuthorizationFilter
    {
        private IConfiguration _configuration;

        public JWTMiddleware(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public class JWTmodel { 
        
            public string Username { get; set; }
            public string Name { get; set; }
            public int Exp { get; set; }
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            if (context.HttpContext.Request.Headers.ContainsKey("Token"))
            {
                var token = context.HttpContext.Request.Headers["Token"];
                try
                {
                    var decoded_token = new JwtBuilder().WithAlgorithm(new HMACSHA256Algorithm()).WithSecret(_configuration["JWTsecretkey"]).MustVerifySignature().Decode<JWTmodel>(token);
                }
                catch (Exception e)
                {
                    var resp = new AbstractResponse();
                    resp.Success = false;
                    resp.Message = $"Logg inn på nytt. Invalid token: {e.Message}";
                    context.Result = new ContentResult()
                    {
                        Content = JsonConvert.SerializeObject(resp),
                        ContentType = "application/json; charset=UTF-8",
                        StatusCode = 401
                    };
                }
                await Task.CompletedTask;
                return;
            }
            var respfinal = new AbstractResponse();
            respfinal.Success = false;
            respfinal.Message = $"Logg inn på nytt. No token found in header";
            context.Result = new ContentResult()
            {
                Content = JsonConvert.SerializeObject(respfinal),
                ContentType = "application/json; charset=UTF-8",
                StatusCode = 401
            };
            await Task.CompletedTask;
            return;
        }

    }
}

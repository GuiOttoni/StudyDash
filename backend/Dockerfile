FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY StudyDash.Api/StudyDash.Api.csproj StudyDash.Api/
RUN dotnet restore StudyDash.Api/StudyDash.Api.csproj

COPY . .
RUN dotnet publish StudyDash.Api/StudyDash.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "StudyDash.Api.dll"]

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY StudyDash.Messaging/StudyDash.Messaging.csproj StudyDash.Messaging/
COPY StudyDash.WorkerApi/StudyDash.WorkerApi.csproj StudyDash.WorkerApi/
RUN dotnet restore StudyDash.WorkerApi/StudyDash.WorkerApi.csproj

COPY StudyDash.Messaging/ StudyDash.Messaging/
COPY StudyDash.WorkerApi/ StudyDash.WorkerApi/
RUN dotnet publish StudyDash.WorkerApi/StudyDash.WorkerApi.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "StudyDash.WorkerApi.dll"]

using Amazon.CDK;
using Amazon.CDK.AWS.RDS;

namespace Piwigo
{
    public class PiwigoStack : Stack
    {
        internal PiwigoStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            var networkStack = new NetworkStack(scope, id);
            var networkStackOutputParameters = networkStack.OutputParameters;

        }
    }
}
